import { useState, useRef } from "react";
import { verifyUser } from "../lib/ekyc";

export default function EKYCVerify() {
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const runVerification = async () => {
    setRunning(true); setResult(null);

    // Step 1: Capture face
    setStatus("📷 Look at the camera...");
    const vidStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current!.srcObject = vidStream;
    await videoRef.current!.play();
    const faceBlob: Blob = await new Promise(resolve => {
      setTimeout(() => {
        const c = document.createElement("canvas");
        c.width = 640; c.height = 480;
        c.getContext("2d")!.drawImage(videoRef.current!, 0, 0);
        c.toBlob(b => resolve(b!), "image/jpeg", 0.92);
        vidStream.getTracks().forEach(t => t.stop());
      }, 2500);
    });

    // Step 2: Capture voice
    setStatus("🎤 Say your name clearly...");
    const audStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const voiceBlob: Blob = await new Promise(resolve => {
      const rec = new MediaRecorder(audStream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => { resolve(new Blob(chunks, { type: "audio/wav" })); };
      rec.start();
      setTimeout(() => { rec.stop(); audStream.getTracks().forEach(t => t.stop()); }, 4000);
    });

    // Step 3: Call fusion API
    setStatus("🔐 Verifying your identity...");
    try {
      const res = await verifyUser(faceBlob, voiceBlob);
      setResult(res);
      setStatus(res.decision === "ACCEPT" ? "✅ Identity Verified" : "❌ Verification Failed");
    } catch (e) {
      setStatus("❌ Error connecting to verification server.");
    }
    setRunning(false);
  };

  const accepted = result?.decision === "ACCEPT";

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Identity Verification</h1>
      <p className="text-gray-500 text-sm">
        We'll verify your face and voice to confirm it's you.
      </p>

      <video ref={videoRef}
        className="w-full rounded-xl bg-black aspect-video"
        muted playsInline />

      <button onClick={runVerification} disabled={running}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold">
        {running ? "Verifying..." : "🔐 Verify My Identity"}
      </button>

      {status && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          accepted ? "bg-green-50 text-green-800 border border-green-200" :
          result ? "bg-red-50 text-red-800 border border-red-200" :
          "bg-blue-50 text-blue-800 border border-blue-200"}`}>
          {status}
        </div>
      )}

      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1 text-sm">
          <p><span className="font-semibold">Face score:</span> {result.face?.score?.toFixed(3)}</p>
          <p><span className="font-semibold">Voice score:</span> {result.voice?.score?.toFixed(3)}</p>
          <p><span className="font-semibold">Fused score:</span> {result.fusion?.fused_score?.toFixed(3)}</p>
          <p><span className="font-semibold">Reason:</span> {result.reason}</p>
        </div>
      )}
    </div>
  );
}