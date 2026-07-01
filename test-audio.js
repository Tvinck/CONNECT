async function test() {
  try {
    console.log("Testing audio...");
    const res = await fetch('http://localhost:3000/api/factory/audio/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: 'привет мир' })
    });
    console.log("Audio:", res.status, await res.text());
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
test();
