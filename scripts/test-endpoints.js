async function test() {
  try {
    console.log("Testing balance...");
    const res1 = await fetch('http://localhost:3000/api/factory/balance');
    console.log("Balance:", res1.status, await res1.text());

    console.log("Testing history...");
    const res2 = await fetch('http://localhost:3000/api/factory/history');
    console.log("History:", res2.status, await res2.text());
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

setTimeout(test, 5000);
