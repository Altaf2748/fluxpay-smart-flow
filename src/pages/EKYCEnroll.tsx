import { useState, useRef } from "react";
import { enrollUser } from "../lib/ekyc";

export default function EKYCEnroll() {
  const [step, setStep] = useState<"idle"|"camera"|"mic"|"done"|"error">("idle");
  const [status, setStatus] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceRef = useRef<Blob | null>(null);
  const voiceRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Replace with your actual Supabase user ID + name from auth context
  const USER_ID = "supabase_user_id_here";
  const USER_NAME = "User Name Here";

  const startCamera = async () => {
    setStep("camera");
    setStatus("Look at the camera. Photo will be taken in 3 seconds...");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    videoRef.current!.srcObject = stream;
    await videoRef.current!.play();
    setTimeout(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = 480;
      canvas.getContext("2d")!.drawImage(videoRef.current!, 0, 0);
      canvas.toBlob(blob => { faceRef.current = blob; }, "image/jpeg", 0.92);
      stream.getTracks().forEach(t => t.stop());
      setStatus("✅ Face captured! Now recording your voice...");
      setTimeout(startMic, 800);
    }, 3000);
  };

  const startMic = async () => {
    setStep("mic");
    setStatus("🎤 Say your name clearly. Recording for 4 seconds...");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      voiceRef.current = new Blob(chunks, { type: "audio/wav" });
      stream.getTracks().forEach(t => t.stop());
      setStatus("Saving your biometric profile...");
      try {
        await enrollUser(USER_ID, faceRef.current!, voiceRef.current!, USER_NAME);
        setStep("done");
        setStatus("✅ Biometric profile saved! You can now use e-KYC verification.");
      } catch (e) {
        setStep("error");
        setStatus("❌ Enrolment failed. Make sure the backend is running.");
      }
    };
    recorder.start();
    setTimeout(() => recorder.stop(), 4000);
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Set Up e-KYC</h1>
      <p className="text-gray-500 text-sm">
        This takes 10 seconds. We'll capture your face and voice once.
        These are stored securely and used to verify your identity.
      </p>
      <video ref={videoRef} className="w-full rounded-xl bg-black aspect-video" muted playsInline />
      {step === "idle" && (
        <button onClick={startCamera}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold">
          Start Biometric Setup
        </button>
      )}
      {status && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          step === "done" ? "bg-green-50 text-green-800 border border-green-200" :
          step === "error" ? "bg-red-50 text-red-800 border border-red-200" :
          "bg-blue-50 text-blue-800 border border-blue-200"}`}>
          {status}
        </div>
      )}
    </div>
  );
}