export const config = { runtime: "edge" };

export default async function handler(req) {
  // Allow only POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing PINATA_JWT env" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // Read multipart/form-data
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const up = new FormData();
    up.append("file", file, file.name || "upload");

    const r = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: up,
    });

    // Read Pinata response as text first (so we can show the real error)
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!r.ok) {
      return new Response(
        JSON.stringify({
          error: "Pinata request failed",
          pinataStatus: r.status,
          pinata: data,
        }),
        {
          status: r.status || 500,
          headers: { "content-type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
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

