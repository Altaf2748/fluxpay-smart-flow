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
  const { data, error } = await supabase
    .from("profiles")
    .select("ekyc_enrolled")
    .eq("user_id", userId)
    .single();

  if (error || !data) return false;
  return (data as any).ekyc_enrolled === true;
}
