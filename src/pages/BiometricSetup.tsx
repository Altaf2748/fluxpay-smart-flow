import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { uploadEKYCMedia, getEKYCMedia } from "@/lib/ekycStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, Camera, Mic, CheckCircle2, RotateCcw, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "intro" | "face" | "face-review" | "voice" | "voice-review" | "saving" | "done";

export default function BiometricSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("intro");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [voiceCountdown, setVoiceCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceRef = useRef<Blob | null>(null);
  const voiceRef = useRef<Blob | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── FACE CAPTURE ──
  const startFaceCapture = async () => {
    setStep("face");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // Countdown 3-2-1
      for (let i = 3; i >= 1; i--) {
        setCountdown(i);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(null);
      capturePhoto();
    } catch {
      toast({ title: "Camera access denied", description: "Please allow camera access to continue.", variant: "destructive" });
      setStep("intro");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext("2d")!.drawImage(video, 0, 0, 640, 480);
    canvas.toBlob(
      (blob) => {
        faceRef.current = blob;
        setFacePreview(canvas.toDataURL("image/jpeg", 0.92));
        stopStream();
        setStep("face-review");
      },
      "image/jpeg",
      0.92
    );
  };

  // ── VOICE CAPTURE ──
  const startVoiceCapture = async () => {
    setStep("voice");
    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        voiceRef.current = new Blob(chunks, { type: "audio/wav" });
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setStep("voice-review");
      };
      recorder.start();

      // 4 second countdown
      for (let i = 4; i >= 1; i--) {
        setVoiceCountdown(i);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setVoiceCountdown(null);
      recorder.stop();
    } catch {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to continue.", variant: "destructive" });
      setIsRecording(false);
      setStep("face-review");
    }
  };

  // ── ENROLL IN BACKEND HELPER ──
  const enrollInBackend = async (uid: string, email: string) => {
    try {
      const urls = await getEKYCMedia(uid);
      if (urls.error || !urls.faceUrl || !urls.voiceUrl) throw new Error("Failed to get signed URLs");

      const [faceRes, voiceRes] = await Promise.all([
        fetch(urls.faceUrl), fetch(urls.voiceUrl)
      ]);
      const [faceBlob, voiceBlob] = await Promise.all([
        faceRes.blob(), voiceRes.blob()
      ]);

      const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
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
          teacher_id: uid,
          name: email,
          image: faceB64,
          audio: voiceB64,
          robot_captured: false,
          pending_approval: false
        })
      });

      if (!backendRes.ok) throw new Error("Backend enrollment failed");
      toast({ title: "Identity verified and secured successfully." });
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
        toast({
          title: "Warning",
          description: "Cannot connect to verification server. Make sure the backend is running on port 8000.",
          variant: "destructive"
        });
      } else {
        toast({ 
          title: "Warning", 
          description: "Biometric backend enrollment failed. You can retry from Settings.", 
          variant: "destructive" 
        });
      }
    }
  };

  // ── SAVE ──
  const handleSave = async () => {
    if (!user || !faceRef.current || !voiceRef.current) return;
    setStep("saving");
    const result = await uploadEKYCMedia(user.id, faceRef.current, voiceRef.current);
    if (result.success) {
      // Enroll in Python backend (non-blocking — failure is tolerated)
      enrollInBackend(user.id, user.email || "unknown").catch(() => {});

      setStep("done");
      toast({ title: "Biometric setup complete", description: "Your identity has been verified successfully." });

      // Use React Router navigate so ProtectedRoute re-checks enrollment
      // via the location.pathname dependency instead of a full page reload.
      // A 1.5s delay lets the user see the success screen.
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } else {
      toast({ title: "Setup failed", description: result.error || "Please try again.", variant: "destructive" });
      setStep("intro");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(230 80% 8%), hsl(260 50% 12%), hsl(220 40% 10%))" }}>
      {/* Decorative blurs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: "var(--gradient-primary)", filter: "blur(120px)" }} />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-15" style={{ background: "var(--gradient-accent)", filter: "blur(100px)" }} />

      <Card className="w-full max-w-lg bg-card/80 backdrop-blur-xl border-border/30 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center glow shadow-lg">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text font-[Space_Grotesk]">FluxPay</span>
          </div>
          <CardTitle className="text-xl font-bold">Biometric Identity Setup</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">One-time secure verification</p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {["Face", "Voice", "Save"].map((label, i) => {
              const stepMap: Step[] = ["face", "voice", "saving"];
              const stepOrder = ["intro", "face", "face-review", "voice", "voice-review", "saving", "done"];
              const currentIdx = stepOrder.indexOf(step);
              const targetIdx = stepOrder.indexOf(stepMap[i]);
              const isActive = currentIdx >= targetIdx;
              return (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-8 h-0.5 ${isActive ? "bg-primary" : "bg-border"}`} />}
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </div>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <AnimatePresence mode="wait">
            {/* ── INTRO ── */}
            {step === "intro" && (
              <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">
                    To keep your account secure, we need to verify your identity using your face and voice. This is a <strong>one-time setup</strong> and takes about 10 seconds.
                  </p>
                </div>
                <Button onClick={startFaceCapture} className="w-full gradient-primary text-primary-foreground border-0 glow h-11 font-semibold">
                  <Camera className="w-4 h-4 mr-2" />
                  Begin Setup
                </Button>
              </motion.div>
            )}

            {/* ── FACE CAPTURE ── */}
            {step === "face" && (
              <motion.div key="face" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span key={countdown} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="text-6xl font-bold text-primary-foreground drop-shadow-lg">
                        {countdown}
                      </motion.span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">Look at the camera. Photo will be taken automatically.</p>
              </motion.div>
            )}

            {/* ── FACE REVIEW ── */}
            {step === "face-review" && facePreview && (
              <motion.div key="face-review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-border/30">
                  <img src={facePreview} alt="Your captured face" className="w-full aspect-video object-cover" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setFacePreview(null); startFaceCapture(); }} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" /> Retake
                  </Button>
                  <Button onClick={startVoiceCapture} className="flex-1 gradient-primary text-primary-foreground border-0 glow font-semibold">
                    <Mic className="w-4 h-4 mr-2" /> Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── VOICE CAPTURE ── */}
            {step === "voice" && (
              <motion.div key="voice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-muted/50 border border-border/30">
                  {isRecording && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm font-medium text-destructive">Recording...</span>
                    </div>
                  )}
                  <Mic className="w-12 h-12 text-primary mb-3" />
                  {voiceCountdown !== null && (
                    <motion.span key={voiceCountdown} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl font-bold text-foreground">
                      {voiceCountdown}
                    </motion.span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">Say your <strong>full name</strong> clearly.</p>
              </motion.div>
            )}

            {/* ── VOICE REVIEW ── */}
            {step === "voice-review" && (
              <motion.div key="voice-review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex flex-col items-center py-8 rounded-xl bg-muted/50 border border-border/30">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-foreground">Voice recorded successfully</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={startVoiceCapture} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" /> Re-record
                  </Button>
                  <Button onClick={handleSave} className="flex-1 gradient-primary text-primary-foreground border-0 glow font-semibold">
                    <Shield className="w-4 h-4 mr-2" /> Save & Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── SAVING ── */}
            {step === "saving" && (
              <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Saving your biometric profile...</p>
              </motion.div>
            )}

            {/* ── DONE ── */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-3" />
                <p className="text-lg font-semibold text-foreground">All set!</p>
                <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
