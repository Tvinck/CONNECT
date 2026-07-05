const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const cliPath = path.join(__dirname, '..', 'node_modules', '@higgsfield', 'cli', 'bin', 'higgsfield.js');

const mascotJobId = '8d38f700-0b12-4c29-b96f-45c58ad416c4';
const logoJobId = 'a3b5708e-0253-4806-bb7c-67eec83bd36e';

function runRembg(jobId, name) {
  return new Promise((resolve, reject) => {
    const args = [
      cliPath,
      'generate',
      'create',
      'image_background_remover',
      '--medias',
      JSON.stringify([{ role: 'image', value: jobId }]),
      '--wait',
      '--json'
    ];

    console.log(`Starting background removal for ${name} (Job ID: ${jobId})...`);
    console.log('Running: node', args.join(' '));

    execFile('node', args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error for ${name}:`, stderr || error.message);
        reject(error);
        return;
      }
      console.log(`✅ Success for ${name}!`);
      try {
        const parsed = JSON.parse(stdout);
        const resultUrl = parsed[0]?.result_url;
        console.log(`Result URL for ${name}:`, resultUrl);
        resolve(resultUrl);
      } catch (e) {
        console.log('Stdout output (raw):', stdout);
        resolve(stdout);
      }
    });
  });
}

async function start() {
  try {
    const mascotResult = await runRembg(mascotJobId, 'Mascot');
    const logoResult = await runRembg(logoJobId, 'Logo');
    
    console.log('\n--- ALL JOBS COMPLETED ---');
    console.log('Mascot cutout URL:', mascotResult);
    console.log('Logo cutout URL:', logoResult);
  } catch (err) {
    console.error('Workflow failed:', err.message);
  }
}

start();
