const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const os = require('os');
const fs = require('fs');

const execAsync = promisify(exec);

async function testGetJob() {
  const tmpBase = os.tmpdir();
  const configDir1 = path.join(tmpBase, '.config', 'higgsfield');
  const configDir2 = path.join(tmpBase, 'higgsfield');
  fs.mkdirSync(configDir1, { recursive: true });
  fs.mkdirSync(configDir2, { recursive: true });

  // Read credentials from local config
  const localCredPath = path.join(os.homedir(), '.config', 'higgsfield', 'credentials.json');
  if (fs.existsSync(localCredPath)) {
    const credsText = fs.readFileSync(localCredPath, 'utf8');
    fs.writeFileSync(path.join(configDir1, 'credentials.json'), credsText);
    fs.writeFileSync(path.join(configDir2, 'credentials.json'), credsText);
  }

  // Get status of a recent job
  const jobId = 'b8e2fc95-d6e8-487a-8b2f-b62761db8223';
  const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate get ${jobId} --json`;

  try {
    const { stdout } = await execAsync(command, {
      env: { ...process.env, HOME: tmpBase, XDG_CONFIG_HOME: tmpBase }
    });
    console.log('✅ CLI output:');
    console.log(stdout.trim());
    const parsed = JSON.parse(stdout.trim());
    console.log('\nParsed structure keys:', Object.keys(parsed));
    console.log('result_url:', parsed.result_url);
    console.log('status:', parsed.status);
  } catch (err) {
    console.error('❌ Error getting job:', err.stderr || err.message);
  }
}

testGetJob();
