async function run() {
  const token = 'oat_OGSJHM6TRJH4VM0KSKVBV86QXCAVEKD6';
  const url = 'https://platform.higgsfield.ai/kling3_0_turbo';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: "test" })
    });
    console.log(res.status, await res.text());
  } catch(e) {
    console.error(e);
  }
}
run();
