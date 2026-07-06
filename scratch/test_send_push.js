require('dotenv').config({ path: '.env.local' });
const webpush = require('web-push');

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('VAPID keys not configured!');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:support@tvinck.ru',
  vapidPublicKey,
  vapidPrivateKey
);

const subscription = {
  "endpoint": "https://web.push.apple.com/QCOiJ5B3luT9uRCmVui5B1b5IT8hfe5EPA-G_VyKqyde0rH3dXKUWWxs0gkdlmAHf8wxq7v8NlLOEjtVqxFaIKKc1JuzqnAN3jpD0brZqfvK0khWmvzUQkU94ReRmJaGxVKnTNV-N5rvLwvsjtdDs23FmPCsjaUASUIbusYbuSs",
  "keys": {
    "p256dh": "BPUAh8KtiiDhJw2Mo568s8aUtBGCOFFCSs822fsibPFp73wHgshU5LtW0pyx5i-CEWguBNHSdOggqMpPz0zqItA",
    "auth": "7W_DNU6_vYinEBxoVmxySw"
  }
};

const payload = JSON.stringify({
  title: 'Test Notification',
  body: 'This is a test web push notification from the server!',
  url: '/'
});

console.log('Sending push notification...');

webpush.sendNotification(subscription, payload)
  .then(res => {
    console.log('Success:', res.statusCode);
  })
  .catch(err => {
    console.error('Error sending push:', err);
  });
