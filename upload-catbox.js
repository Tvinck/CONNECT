const fs = require('fs');
const path = require('path');

async function upload() {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(path.join(__dirname, 'public', 'mascot.png'));
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', blob, 'mascot.png');

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });
    const text = await res.text();
    console.log('UPLOADED TO:', text);
  } catch (e) {
    console.error(e);
  }
}

upload();
