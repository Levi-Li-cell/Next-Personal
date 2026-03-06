const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000";

async function run() {
  const idSuffix = Date.now();
  const name = `smoke-${idSuffix}`;
  const content = `你好，请问你有兴趣来缅甸工作吗 smoke-${idSuffix}`;

  const postRes = await fetch(`${baseUrl}/api/guestbook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      contact: "smoke@example.com",
      content,
    }),
  });

  if (!postRes.ok) {
    throw new Error(`POST /api/guestbook failed with ${postRes.status}`);
  }

  const postData = await postRes.json();
  if (!postData?.success || !postData?.data?.id) {
    throw new Error("POST /api/guestbook returned invalid payload");
  }

  const createdId = postData.data.id;
  const createdStatus = postData.data.status;
  if (createdStatus !== "flagged") {
    throw new Error(`Expected risky message status=flagged, got ${createdStatus}`);
  }

  const listRes = await fetch(`${baseUrl}/api/guestbook?status=public&page=1&limit=20`);
  if (!listRes.ok) {
    throw new Error(`GET /api/guestbook failed with ${listRes.status}`);
  }

  const listData = await listRes.json();
  if (!listData?.success || !Array.isArray(listData?.data)) {
    throw new Error("GET /api/guestbook returned invalid payload");
  }

  const found = listData.data.find((item) => item.id === createdId);
  if (!found) {
    throw new Error("Created guestbook message not found in public list");
  }

  if (found.contact !== null) {
    throw new Error("Public guestbook response leaked contact field");
  }

  if (found.status !== "flagged") {
    throw new Error(`Expected found status=flagged, got ${found.status}`);
  }

  console.log("Guestbook smoke test passed", {
    baseUrl,
    id: createdId,
    status: found.status,
    contact: found.contact,
  });
}

run().catch((error) => {
  console.error("Guestbook smoke test failed:", error);
  process.exit(1);
});
