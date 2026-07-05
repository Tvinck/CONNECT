const { exec } = require('child_process');

exec('node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate list --json', { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
  if (err) {
    console.error('Error listing jobs:', err);
    return;
  }
  const jobs = JSON.parse(stdout);
  const matched = jobs.filter(j => j.job_set_type === 'image_background_remover');
  console.log('Found background remover jobs:', JSON.stringify(matched, null, 2));
});
