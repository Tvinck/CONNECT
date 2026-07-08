import { createHiggsfieldClient } from '@higgsfield/client/v2';

async function test() {
  const client = createHiggsfieldClient({ credentials: "f9f0e5bb-71aa-446b-83ca-4c1a433eb0e2:bbe53d2709bdbfcfaf670319924a054a9a31b6995f1c9a4703711ac115a5799f" });
  try {
    const res = await client.subscribe('kling3_0_turbo', {
      input: {
        prompt: "A beautiful sunset over the mountains",
        aspect_ratio: "16:9",
        duration: 5,
        resolution: "720p"
      },
      withPolling: false
    });
    console.log("Success:", res);
  } catch (e) {
    console.log("Error:", e.message, e.response?.data);
  }
}
test();
