export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) return res.status(500).json({ error: "Missing PINATA_JWT env" });

    const form = await req.formData();
    const file = form.get("file");
    if (!file) return res.status(400).json({ error: "Missing file" });

    const up = new FormData();
    up.append("file", file, file.name || "upload");

    const r = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: up,
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error || data });

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
