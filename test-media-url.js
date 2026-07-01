const https = require('https');

function test(url) {
  https.get(url, (res) => {
    console.log(url, res.statusCode, res.headers['content-type']);
  }).on('error', (e) => {
    console.log(url, e.message);
  });
}

test('https://api.higgsfield.ai/media/1b2ef010-50b6-4a19-8db6-8707d03013b9');
test('https://b2c.higgsfield.ai/media/1b2ef010-50b6-4a19-8db6-8707d03013b9');
test('https://platform.higgsfield.ai/media/1b2ef010-50b6-4a19-8db6-8707d03013b9');
