import { useState, useRef, useEffect } from "react";
import { verifyUser } from "../lib/ekyc";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function EKYCVerify() {
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "");
      }
    });
  }, []);

  const runVerification = async () => {
    setRunning(true); setResult(null);

    try {
      // Step 1: Capture face
      setStatus("Capturing your face...");
      const vidStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = vidStream;
        await videoRef.current.play();
      }
      const faceBlob: Blob = await new Promise(resolve => {
        setTimeout(() => {
          const c = document.createElement("canvas");
          c.width = 640; c.height = 480;
          if (videoRef.current) c.getContext("2d")!.drawImage(videoRef.current, 0, 0, 640, 480);
          c.toBlob(b => resolve(b!), "image/jpeg", 0.92);
          vidStream.getTracks().forEach(t => t.stop());
        }, 2500);
      });

      // Step 2: Capture voice
      setStatus("Recording your voice...");
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
      setStatus("Verifying identity...");
      const res = await verifyUser(faceBlob, voiceBlob);
      setResult(res);
      
      if (res.decision === "ACCEPT") {
        setStatus("✅ Identity Verified");
        const returnTo = location.state?.returnTo;
        if (returnTo) {
          setTimeout(() => {
            navigate(returnTo, { state: { ...location.state, verifiedResult: "ACCEPT" }, replace: true });
          }, 2000);
        }
      } else {
        setStatus("❌ Identity verification failed. Payment cancelled for your security.");
      }
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
        setStatus("❌ Cannot connect to verification server. Make sure the backend is running on port 8000.");
        setResult({ decision: "REJECT", reason: "Cannot connect to verification server. Make sure the backend is running on port 8000." });
      } else {
        setStatus("❌ Error connecting to verification server.");
        setResult({ decision: "REJECT", reason: msg });
      }
    }
    setRunning(false);
  };

  const accepted = result?.decision === "ACCEPT";

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-md mb-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Identity Verification</h1>
      </div>
      
      <Card className="w-full max-w-md border-border/50">
        <CardHeader>
          <CardTitle>Security Check</CardTitle>
          {userEmail && <p className="text-sm text-muted-foreground">Verifying user: {userEmail}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
            {(!videoRef.current || !running) && !result && (
              <span className="text-muted-foreground/50 text-sm">Camera will appear here</span>
            )}
            <video ref={videoRef} className="w-full h-full object-cover absolute inset-0" muted playsInline />
          </div>

          {!result && (
            <Button onClick={runVerification} disabled={running} className="w-full h-12 gradient-primary text-white font-semibold glow">
              {running ? "Verifying..." : "Verify Now →"}
            </Button>
          )}

          {status && !result && (
            <div className="p-4 rounded-xl text-center bg-blue-50 text-blue-800 border border-blue-200 font-medium">
              {status}
            </div>
          )}

          {result && accepted && (
            <div className="p-6 rounded-xl text-center bg-green-50 border border-green-200 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="font-bold text-green-800 text-lg">Verification Successful</h3>
              <div className="space-y-1 text-sm text-green-700 font-medium">
                <p>Face Match: {(result.face?.score * 100).toFixed(1)}%</p>
                <p>Voice Match: {(result.voice?.score * 100).toFixed(1)}%</p>
                <p>Final Confidence: {(result.fusion?.fused_score * 100).toFixed(1)}%</p>
              </div>
              {location.state?.returnTo && (
                <p className="text-xs text-green-600 mt-2">Returning automatically...</p>
              )}
            </div>
          )}

          {result && !accepted && (
            <div className="p-6 rounded-xl text-center bg-destructive/10 border border-destructive/20 space-y-4">
              <XCircle className="w-12 h-12 text-destructive mx-auto" />
              <h3 className="font-bold text-destructive text-lg">Verification Failed</h3>
              <p className="text-sm text-destructive/80 font-medium">{result.reason || "Unable to confirm your identity"}</p>
              <Button onClick={runVerification} variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}