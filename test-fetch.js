async function run() {
  const token = 'oat_OGSJHM6TRJH4VM0KSKVBV86QXCAVEKD6';
  const url = 'https://platform.higgsfield.ai/v1/auth/me';
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(res.status, await res.text());
  } catch(e) {
    console.error(e);
  }
}
run();
