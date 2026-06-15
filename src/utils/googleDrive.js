const GIS_SRC = "https://accounts.google.com/gsi/client";
let gisReady = false;
let gisLoading = null;

function ensureGIS() {
  if (gisReady) return Promise.resolve();
  if (gisLoading) return gisLoading;
  gisLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => { gisReady = true; resolve(); };
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(script);
  });
  return gisLoading;
}

function requestToken(clientId) {
  return new Promise((resolve, reject) => {
    /* global google */
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (resp) => {
        if (resp.error) reject(new Error(resp.error_description || resp.error));
        else resolve(resp.access_token);
      },
      error_callback: (err) => reject(new Error(err.message || "Auth failed")),
    });
    client.requestAccessToken();
  });
}

export async function uploadWorkoutsToGoogleDrive(clientId, csvContent) {
  await ensureGIS();
  const token = await requestToken(clientId);

  const filename = "FitLog-Workouts.csv";

  const searchResp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${filename}' and trashed=false`)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!searchResp.ok) throw new Error("Could not search Google Drive");
  const { files } = await searchResp.json();
  const existingId = files?.[0]?.id;

  const metadata = { name: filename, mimeType: "text/csv" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([csvContent], { type: "text/csv" }));

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const resp = await fetch(url, {
    method: existingId ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Upload failed (${resp.status})`);
  }
  return existingId ? "updated" : "created";
}
