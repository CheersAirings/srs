// Minimal JWT verification (RS256) using WebCrypto
// Verifies signature and standard time claims: exp, nbf, iat (with small skew)

const BASE64URL_REPLACE_REGEX = /-/g;
const BASE64URL_REPLACE_REGEX_2 = /_/g;

function base64UrlToUint8Array(base64Url: string): Uint8Array {
	const base64 = base64Url
		.replace(BASE64URL_REPLACE_REGEX, '+')
		.replace(BASE64URL_REPLACE_REGEX_2, '/')
		.padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

function stringToUint8Array(input: string): Uint8Array {
	return new TextEncoder().encode(input);
}

interface JwtHeader {
	alg?: string;
	typ?: string;
	[key: string]: unknown;
}

interface JwtPayload {
	exp?: number;
	nbf?: number;
	iat?: number;
	[key: string]: unknown;
}

function parseJwt(token: string): { header: JwtHeader; payload: JwtPayload; signature: Uint8Array; signingInput: Uint8Array } {
	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid JWT format');
	}
	const [encodedHeader, encodedPayload, encodedSignature] = parts;
	const headerJson = new TextDecoder().decode(base64UrlToUint8Array(encodedHeader));
	const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(encodedPayload));
	const header = JSON.parse(headerJson);
	const payload = JSON.parse(payloadJson);
	const signature = base64UrlToUint8Array(encodedSignature);
	const signingInput = stringToUint8Array(`${encodedHeader}.${encodedPayload}`);
	return { header, payload, signature, signingInput };
}

async function importRsaPublicKeyFromPem(pem: string): Promise<CryptoKey> {
	// Accept PEM with header/footer or raw base64
	const pemBody = pem
		.replace('-----BEGIN PUBLIC KEY-----', '')
		.replace('-----END PUBLIC KEY-----', '')
		.replace(/\r?\n|\r/g, '')
		.trim();
	const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
	return crypto.subtle.importKey(
		'spki',
		der,
		{
			name: 'RSASSA-PKCS1-v1_5',
			hash: 'SHA-256',
		},
		false,
		['verify']
	);
}

function isTimeClaimsValid(payload: JwtPayload, nowSeconds: number, skewSeconds: number): boolean {
	// exp: expiration time > now - skew
	if (typeof payload.exp === 'number' && nowSeconds - skewSeconds >= payload.exp) {
		return false;
	}
	// nbf: not before <= now + skew
	if (typeof payload.nbf === 'number' && nowSeconds + skewSeconds < payload.nbf) {
		return false;
	}
	// iat: issued at <= now + skew
	if (typeof payload.iat === 'number' && payload.iat > nowSeconds + skewSeconds) {
		return false;
	}
	return true;
}

export async function verifyJwtWithPublicKey(token: string, publicKeyPem: string): Promise<boolean> {
	if (typeof window === 'undefined' || !('crypto' in window) || !('subtle' in window.crypto)) {
		return false;
	}
	let parsed;
	try {
		parsed = parseJwt(token);
	} catch {
		return false;
	}
	const { header, payload, signature, signingInput } = parsed;
	if (!header || header.alg !== 'RS256') {
		return false;
	}
	try {
		const publicKey = await importRsaPublicKeyFromPem(publicKeyPem);
		const validSig = await crypto.subtle.verify(
			{ name: 'RSASSA-PKCS1-v1_5' },
			publicKey,
			signature as BufferSource,
			signingInput as BufferSource
		);
		if (!validSig) return false;
		const nowSeconds = Math.floor(Date.now() / 1000);
		const skewSeconds = 60; // allow 1 minute clock skew
		return isTimeClaimsValid(payload, nowSeconds, skewSeconds);
	} catch {
		return false;
	}
}

export function getTokenFromStorage(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}





