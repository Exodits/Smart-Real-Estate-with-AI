import { spawn } from 'child_process';
import process from 'process';

console.log('\x1b[36m%s\x1b[0m', '>>> Starting TerraFind Development Environment (Maharashtra Platform)...');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  shell: isWindows
});

const client = spawn(npmCmd, ['run', 'dev:client'], {
  stdio: 'inherit',
  shell: isWindows
});

function cleanup() {
  console.log('\nStopping servers...');
  if (server) server.kill();
  if (client) client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
