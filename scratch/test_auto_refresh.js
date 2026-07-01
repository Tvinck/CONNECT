// Test: CLI auto-refreshes credentials via hf.exe binary
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

async function testAutoRefresh() {
  const credsPath = path.join(os.homedir(), '.config', 'higgsfield', 'credentials.json');
  const credsBefore = fs.readFileSync(credsPath, 'utf8');
  
  console.log('Token BEFORE:', JSON.parse(credsBefore).access_token?.substring(0, 30) + '...');
  
  // Run any CLI command - the Go binary auto-refreshes via refresh_token
  try {
    const { stdout } = await execAsync(
      'node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate list --json',
      { env: { ...process.env, HOME: os.homedir(), APPDATA: process.env.APPDATA } }
    );
    console.log('CLI works, jobs:', JSON.parse(stdout.trim()).length);
  } catch (err) {
    console.error('CLI error:', err.stderr || err.message);
  }
  
  const credsAfter = fs.readFileSync(credsPath, 'utf8');
  console.log('Token AFTER:', JSON.parse(credsAfter).access_token?.substring(0, 30) + '...');
  
  if (credsBefore !== credsAfter) {
    console.log('✅ CLI auto-refreshed credentials!');
  } else {
    console.log('ℹ️ Credentials unchanged (still valid, no refresh needed).');
  }
}

testAutoRefresh();
