const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== 1. Установка утилит ==="
    apt-get update && apt-get install -y sqlite3 jq iptables-persistent netfilter-persistent

    echo "=== 2. Обновление Inbounds ==="
    # Получаем текущие inbounds
    sqlite3 /etc/x-ui/x-ui.db "SELECT id, settings FROM inbounds;" > /tmp/inbounds.txt
    
    # Мы знаем, что там один VLESS Reality inbound (id=1 или id=2). 
    # Сделаем простую замену подстроки в SQLite (заменим gateway.icloud.com на yahoo.com)
    sqlite3 /etc/x-ui/x-ui.db "UPDATE inbounds SET settings = REPLACE(settings, 'gateway.icloud.com', 'yahoo.com');"
    sqlite3 /etc/x-ui/x-ui.db "UPDATE inbounds SET stream_settings = REPLACE(stream_settings, 'gateway.icloud.com', 'yahoo.com');"

    echo "=== 3. Обновление xrayTemplateConfig ==="
    sqlite3 /etc/x-ui/x-ui.db "SELECT value FROM settings WHERE key='xrayTemplateConfig';" > /tmp/template.json
    
    # Добавляем DNS 1.1.1.1 и 8.8.8.8, и меняем domainStrategy на UseIPv4 если еще не стоит
    jq '.dns = { "servers": [ "1.1.1.1", "8.8.8.8", "localhost" ] }' /tmp/template.json > /tmp/template_patched.json
    
    ESCAPED_JSON=$(cat /tmp/template_patched.json | sed "s/'/''/g")
    sqlite3 /etc/x-ui/x-ui.db "UPDATE settings SET value='\$ESCAPED_JSON' WHERE key='xrayTemplateConfig';"

    echo "=== 4. Настройка TCP MSS Clamping ==="
    # Удаляем старое правило если есть
    iptables -t mangle -D FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || true
    # Добавляем новое правило
    iptables -t mangle -I FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
    
    # Сохраняем правила
    iptables-save > /etc/iptables/rules.v4
    netfilter-persistent save

    echo "=== 5. Перезапуск X-UI ==="
    systemctl restart x-ui
    sleep 2
    journalctl -u x-ui -n 20 --no-pager
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
      console.log(out);
      conn.end();
    }).on('data', (data) => {
      out += data;
    }).stderr.on('data', (data) => {
      out += data;
    });
  });
}).on('error', (err) => {
  console.error('SSH connection error:', err);
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
