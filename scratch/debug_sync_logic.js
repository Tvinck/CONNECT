const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const conn = new Client();

const localDebugScript = `
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const https = require('https');
const dotenv = require('dotenv');
const path = require('path');
const ws = require('ws');

dotenv.config({ path: '/opt/bazzar-sync/.env' });
dotenv.config({ path: '/opt/bazzar-sync/tg-bot/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});
const api = axios.create({
  baseURL: process.env.XUI_URL.endsWith('/') ? process.env.XUI_URL : process.env.XUI_URL + '/',
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  withCredentials: true
});

async function run() {
  console.log('Logging in...');
  const homeRes = await api.get('');
  const html = typeof homeRes.data === 'string' ? homeRes.data : '';
  const csrfMatch = html.match(/name="csrf-token"\\s+content="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';
  const rawCookies = homeRes.headers['set-cookie'] || [];
  const sessionCookie = rawCookies[0] ? rawCookies[0].split(';')[0] : '';

  const loginRes = await api.post('login',
    { username: process.env.XUI_USERNAME, password: process.env.XUI_PASSWORD },
    { headers: { 'X-Csrf-Token': csrfToken, 'Cookie': sessionCookie } }
  );
  const authCookies = loginRes.headers['set-cookie'] || [];
  const authCookie = authCookies[0] ? authCookies[0].split(';')[0] : '';
  
  api.defaults.headers.common['Cookie'] = authCookie || sessionCookie;
  api.defaults.headers.common['X-Csrf-Token'] = csrfToken;

  console.log('Logged in. Fetching inbounds...');
  const inboundsRes = await api.get('panel/api/inbounds/list');
  const inbounds = inboundsRes.data.obj || [];
  const vlessInbounds = inbounds.filter(i => i.protocol === 'vless');
  const vlessInboundIds = vlessInbounds.map(i => i.id);

  console.log('VLESS Inbound IDs:', vlessInboundIds);

  const xuiMap = new Map();
  for (const inbound of vlessInbounds) {
    const settings = typeof inbound.settings === 'string' ? JSON.parse(inbound.settings) : inbound.settings;
    console.log('Inbound ID ' + inbound.id + ' (' + inbound.remark + ') clients:');
    if (settings && settings.clients) {
      console.log(settings.clients.map(c => c.email + ' : ' + c.id));
      for (const c of settings.clients) {
        if (!xuiMap.has(c.email)) {
          xuiMap.set(c.email, {
            email: c.email,
            enable: c.enable,
            total: c.totalGB || 0,
            expiryTime: c.expiryTime || 0,
            limitIp: c.limitIp || 3,
            flow: c.flow || '',
            traffic: 0,
            inboundIds: new Set()
          });
        }
        xuiMap.get(c.email).inboundIds.add(inbound.id);
      }
    } else {
      console.log('None');
    }
  }

  console.log('xuiMap Keys:', Array.from(xuiMap.keys()));

  const { data: subs } = await supabase.from('vpn_subscriptions').select('token, status, expires_at');
  console.log('Supabase subscriptions count:', subs ? subs.length : 0);

  for (const sub of subs) {
    const xuiClient = xuiMap.get(sub.token);
    if (!xuiClient) {
      console.log('- Client ' + sub.token + ' (' + sub.status + ') not found in X-UI.');
    } else {
      const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();
      const shouldEnable = sub.status === 'active' && !isExpired;
      console.log('- Client ' + sub.token + ': status=' + sub.status + ', isExpired=' + isExpired + ', shouldEnable=' + shouldEnable + ', inboundIds=' + Array.from(xuiClient.inboundIds).join(','));

      let needsRecreation = false;
      if (shouldEnable) {
        for (const inboundId of vlessInboundIds) {
          if (!xuiClient.inboundIds.has(inboundId)) {
            console.log('  -> MISSING INBOUND ID: ' + inboundId);
            needsRecreation = true;
            break;
          }
        }
      }
      console.log('  -> needsRecreation=' + needsRecreation);
    }
  }
}
run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/debug_sync.js');
    stream.end(localDebugScript);
    stream.on('close', () => {
      console.log('Debug script uploaded.');
      conn.exec('NODE_PATH=/opt/bazzar-sync/node_modules node /tmp/debug_sync.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('close', () => {
          console.log('Execution result:');
          console.log(out);
          conn.end();
        }).on('data', (d) => out += d).stderr.on('data', (d) => out += d);
      });
    });
  });
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
