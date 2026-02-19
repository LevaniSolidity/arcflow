// api/pinFile.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = process.env.NFT_STORAGE_TOKEN;
    if (!token) return res.status(500).json({ error: "Missing NFT_STORAGE_TOKEN env" });

    const form = await req.formData();
    const file = form.get("file");
    if (!file) return res.status(400).json({ error: "Missing file" });

    // Do NOT set Content-Type manually (more compatible)
    const r = await fetch("https://api.nft.storage/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: file,
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({
        error: "NFT.Storage upload failed",
        details: data?.error?.message || data?.error || data,
      });
    }

    const cid = data?.value?.cid;
    if (!cid) return res.status(502).json({ error: "Missing cid in response", raw: data });

    // Pinata-compatible shape for your frontend:
    return res.status(200).json({ IpfsHash: cid });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

