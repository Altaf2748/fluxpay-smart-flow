import { supabase } from "@/integrations/supabase/client";

const BUCKET = "ekyc-media";

interface UploadResult {
  success: boolean;
  error?: string;
}

interface MediaUrls {
  faceUrl?: string;
  voiceUrl?: string;
  error?: string;
}

/**
 * Upload face photo and voice recording to Supabase Storage,
 * then mark the user's profile as ekyc_enrolled = true.
 */
export async function uploadEKYCMedia(
  userId: string,
  faceBlob: Blob,
  voiceBlob: Blob
): Promise<UploadResult> {
  try {
    // Upload face photo
    const { error: faceError } = await supabase.storage
      .from(BUCKET)
      .upload(`${userId}/face.jpg`, faceBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (faceError) {
      return { success: false, error: `Face upload failed: ${faceError.message}` };
    }

    // Upload voice recording
    const { error: voiceError } = await supabase.storage
      .from(BUCKET)
      .upload(`${userId}/voice.wav`, voiceBlob, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (voiceError) {
      return { success: false, error: `Voice upload failed: ${voiceError.message}` };
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ ekyc_enrolled: true } as any)
      .eq("user_id", userId);

    if (profileError) {
      return { success: false, error: `Profile update failed: ${profileError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error during eKYC upload" };
  }
}

/**
 * Get signed URLs (60s expiry) for a user's face and voice files.
 */
export async function getEKYCMedia(userId: string): Promise<MediaUrls> {
  try {
    const { data: faceData, error: faceError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${userId}/face.jpg`, 60);

    if (faceError) {
      return { error: `Face URL failed: ${faceError.message}` };
    }

    const { data: voiceData, error: voiceError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${userId}/voice.wav`, 60);

    if (voiceError) {
      return { error: `Voice URL failed: ${voiceError.message}` };
    }

    return {
      faceUrl: faceData.signedUrl,
      voiceUrl: voiceData.signedUrl,
    };
  } catch (err: any) {
    return { error: err.message || "Unknown error getting eKYC media" };
  }
}

/**
 * Check if a user has completed biometric enrolment.
 */
export async function isEKYCEnrolled(userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("ekyc_enrolled")
    .eq("user_id", userId)
    .single();

  if (error || !data) return false;
  return (data as any).ekyc_enrolled === true;
}

/**
 * Fetch signed URLs, download the media, convert to base64 and register with Python Backend.
 */
export async function enrollInPythonBackend(userId: string, userEmail: string): Promise<{success: boolean, error?: string}> {
  try {
    const urls = await getEKYCMedia(userId);
    if (urls.error || !urls.faceUrl || !urls.voiceUrl) {
      return { success: false, error: urls.error || "Failed finding media URLs" };
    }

    const [faceRes, voiceRes] = await Promise.all([
      fetch(urls.faceUrl),
      fetch(urls.voiceUrl)
    ]);
    
    if (!faceRes.ok || !voiceRes.ok) {
      return { success: false, error: "Failed to download media blobs" };
    }

    const [faceBlob, voiceBlob] = await Promise.all([
      faceRes.blob(),
      voiceRes.blob()
    ]);

    const blobToBase64 = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const faceB64 = await blobToBase64(faceBlob);
    const voiceB64 = await blobToBase64(voiceBlob);

    const backendRes = await fetch("http://localhost:8000/api/register_teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacher_id: userId,
        name: userEmail,
        image: faceB64,
        audio: voiceB64,
        robot_captured: false,
        pending_approval: false
      }),
    });

    if (!backendRes.ok) {
      const msg = await backendRes.text();
      throw new Error(`Python backend failed: ${backendRes.status} ${msg}`);
    }

    return { success: true };
  } catch (err: any) {
    const msg = err.message || "";
    if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
      return { success: false, error: "Cannot connect to verification server. Make sure the backend is running on port 8000." };
    }
    return { success: false, error: msg || "Unknown error enrolling in Python backend" };
  }
}
