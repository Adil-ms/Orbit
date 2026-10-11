// Runs the API server and the Vite dev server together: `npm run dev:full`
import { spawn } from 'node:child_process'

const procs = [
  spawn(process.execPath, ['--env-file-if-exists=server/.env', '--env-file-if-exists=.env', '--watch', 'server/index.js'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], { stdio: 'inherit' }),
]
const stop = () => procs.forEach((p) => p.kill())
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
procs.forEach((p) => p.on('exit', (code) => code && stop()))
