
export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const token = process.env.NFT_STORAGE_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing NFT_STORAGE_TOKEN env" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Missing JSON body" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });

    const upRes = await fetch("https://api.nft.storage/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: blob,
    });

    const data = await upRes.json().catch(() => ({}));

    if (!upRes.ok) {
      const details = data?.error?.message || data?.error || data || "Upload failed";
      return new Response(JSON.stringify({ error: "NFT.Storage upload failed", details }), {
        status: upRes.status,
        headers: { "content-type": "application/json" },
      });
    }

    const cid = data?.value?.cid;
    if (!cid) {
      return new Response(JSON.stringify({ error: "Missing cid in response", raw: data }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    // Pinata-compatible shape for your frontend:
    return new Response(JSON.stringify({ IpfsHash: cid }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
