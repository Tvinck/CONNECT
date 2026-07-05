const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const mascotUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_3FrzNLHQyHPY4HbkSAq6D54Kaln/hf_20260705_143646_8d38f700-0b12-4c29-b96f-45c58ad416c4.png';
const logoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_3FrzNLHQyHPY4HbkSAq6D54Kaln/hf_20260705_143711_a3b5708e-0253-4806-bb7c-67eec83bd36e.png';

const mascotRawPath = path.join(__dirname, 'mascot_raw.png');
const logoRawPath = path.join(__dirname, 'logo_raw.png');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url} to ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function start() {
  try {
    console.log('Downloading mascot and logo from Higgsfield Cloudfront CDN...');
    await downloadFile(mascotUrl, mascotRawPath);
    await downloadFile(logoUrl, logoRawPath);

    console.log('\nRunning background removal for Mascot using local file...');
    const mascotCmd = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate create image_background_remover --image "${mascotRawPath}" --wait --json`;
    console.log(`Command: ${mascotCmd}`);
    const { stdout: mascotOut } = await execAsync(mascotCmd);
    console.log('Mascot cutout response:', mascotOut);

    console.log('\nRunning background removal for Logo using local file...');
    const logoCmd = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate create image_background_remover --image "${logoRawPath}" --wait --json`;
    console.log(`Command: ${logoCmd}`);
    const { stdout: logoOut } = await execAsync(logoCmd);
    console.log('Logo cutout response:', logoOut);

  } catch (err) {
    console.error('Error occurred:', err.stderr || err.message);
  }
}

start();
