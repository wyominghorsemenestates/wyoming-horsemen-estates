import { put, head } from '@vercel/blob';

// This is the "filename" used inside Blob storage to hold the site's data.
// Keep it the same across deploys so the site keeps finding the same file.
const PATHNAME = 'whe-data.json';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Try to fetch the existing saved data. If nothing has been saved
      // yet (first time site is used), return null so the front-end
      // falls back to its built-in defaults.
      try {
        const blob = await head(PATHNAME, {
          token: process.env.WHE_BLOB_READ_WRITE_TOKEN,
        });
        const response = await fetch(blob.url);
        const data = await response.json();
        return res.status(200).json(data);
      } catch (e) {
        return res.status(200).json(null);
      }
    }

    if (req.method === 'POST') {
      // Simple protection: only allow saves if the request includes the
      // correct admin key. This isn't bank-vault security, just a guard
      // against random internet traffic hitting the save endpoint.
      const key = req.headers['x-admin-key'];
      if (key !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await put(PATHNAME, JSON.stringify(req.body), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
        addRandomSuffix: false,
        token: process.env.WHE_BLOB_READ_WRITE_TOKEN,
      });

      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
