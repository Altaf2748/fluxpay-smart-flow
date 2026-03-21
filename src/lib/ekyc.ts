const API = "http://localhost:8000";

// Convert a Blob to base64 string (the API expects base64-encoded images/audio)
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip "data:...;base64," prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── ENROLL a user ────────────────────────────────────────────────────────
// Call this once when a user first sets up e-KYC in their FluxPay account.
// userId should be their Supabase user ID.
export async function enrollUser(
  userId: string,
  faceBlob: Blob,
  voiceBlob: Blob,
  userName: string
) {
  const [imageB64, audioB64] = await Promise.all([
    blobToBase64(faceBlob),
    blobToBase64(voiceBlob),
  ]);

  const res = await fetch(`${API}/api/register_teacher`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teacher_id: userId,        // your Supabase user ID
      name: userName,
      image: imageB64,
      audio: audioB64,
      robot_captured: false,
      pending_approval: false,  // set true if you want admin approval step
    }),
  });

  if (!res.ok) throw new Error(`Enroll failed: ${res.status}`);
  return res.json();
}

// ── VERIFY a user ────────────────────────────────────────────────────────
// Call this when a user needs to verify identity (e.g. before a large payment).
export async function verifyUser(faceBlob: Blob, voiceBlob: Blob) {
  const [imageB64, audioB64] = await Promise.all([
    blobToBase64(faceBlob),
    blobToBase64(voiceBlob),
  ]);

  const res = await fetch(`${API}/api/verify_fusion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: imageB64,
      audio: audioB64,
      source: "fluxpay_web",
    }),
  });

  if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
  return res.json();
  // Returns: { decision:"ACCEPT"|"REJECT", fusion:{fused_score},
  //           face:{score,recognized}, voice:{score,recognized} }
}