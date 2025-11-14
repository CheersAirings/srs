import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { getTokenFromStorage, verifyJwtWithPublicKey } from '../utils/jwt';

const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'token';
const PUBLIC_KEY = import.meta.env.VITE_JWT_PUBLIC_KEY as string | undefined;

export default function AuthGate(props: PropsWithChildren) {
	const [allowed, setAllowed] = useState<boolean | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const token = getTokenFromStorage(TOKEN_KEY);
			if (!token || !PUBLIC_KEY) {
				if (!cancelled) setAllowed(false);
				return;
			}
			const ok = await verifyJwtWithPublicKey(token, PUBLIC_KEY);
			if (!cancelled) setAllowed(ok);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	if (allowed !== true) {
		// Blank page when no/invalid token or while checking
		return null;
	}
	return <>{props.children}</>;
}





