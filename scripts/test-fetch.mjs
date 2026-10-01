async function testAdmin() {
  try {
    const res = await fetch("http://localhost:3000/admin", { redirect: "manual" });
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log("Body length:", text.length, "Sample:", text.slice(0, 200));
  } catch(e) {
    console.error("Error:", e);
  }
}
testAdmin();
