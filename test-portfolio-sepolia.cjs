async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/portfolio/0x1234?chain=0xaa36a7');
    const data = await res.text();
    console.log('Status:', res.status);
    console.log('Data:', data);
  } catch (e) {
    console.error(e);
  }
}
test();
