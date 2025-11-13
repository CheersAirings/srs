import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName =
  process.env.GITHUB_REPOSITORY?.split('/')?.[1]
const isGithubPagesBuild =
  process.env.GITHUB_ACTIONS === 'true' &&
  repoName &&
  !repoName.endsWith('.github.io')

// https://vite.dev/config/
export default defineConfig({
  base: isGithubPagesBuild ? `/${repoName}/` : '/',
  plugins: [react()],
})
