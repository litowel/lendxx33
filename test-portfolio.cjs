async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/portfolio/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?chain=0x1');
    const data = await res.text();
    console.log('Status:', res.status);
    console.log('Data:', data);
  } catch (e) {
    console.error(e);
  }
}
test();
