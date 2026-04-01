async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolio: { balance: 0, tokens: [] },
        aaveData: {},
        chainId: 1
      })
    });
    const data = await res.text();
    console.log('Status:', res.status);
    console.log('Data:', data);
  } catch (e) {
    console.error(e);
  }
}
test();
