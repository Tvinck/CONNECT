async function fetchOpenApi() {
  const urls = [
    'https://platform.higgsfield.ai/openapi.json',
    'https://api.higgsfield.ai/openapi.json',
    'https://platform.higgsfield.ai/v1/openapi.json',
    'https://platform.higgsfield.ai/api-docs/openapi.json'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`[${res.status}] ${url}`);
      if (res.status === 200) {
        const text = await res.text();
        console.log("Success! Starts with: ", text.slice(0, 100));
        require('fs').writeFileSync('openapi.json', text);
        return;
      }
    } catch(e) {}
  }
}
fetchOpenApi();
