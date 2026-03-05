import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ShieldCheck, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const MPINReset = () => {
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'pin' | 'otp' | null>(null);
  const [currentMpin, setCurrentMpin] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [confirmNewMpin, setConfirmNewMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [securityVerified, setSecurityVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();

  const hashMPIN = async (pin: string) => {
    const msgUint8 = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No email found");

      // Use Supabase's built-in OTP for reauthentication
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (token: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No email found");

      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token,
        type: 'email',
      });

      if (error) throw error;

      setSecurityVerified(true);
      toast({ title: "Verified", description: "Please enter your new MPIN" });
    } catch (error: any) {
      toast({
        title: "Invalid OTP",
        description: error.message || "The OTP is incorrect or expired",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentMpin.length !== 4 || !/^\d+$/.test(currentMpin)) {
      toast({ title: "Invalid MPIN", description: "MPIN must be 4 digits", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const mpinHash = await hashMPIN(currentMpin);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('mpin_hash')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (profile.mpin_hash !== mpinHash) {
        toast({ title: "Invalid MPIN", description: "Current MPIN is incorrect", variant: "destructive" });
        return;
      }

      setSecurityVerified(true);
      toast({ title: "Verified", description: "Please enter your new MPIN" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to verify MPIN", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetMPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMpin.length !== 4 || !/^\d+$/.test(newMpin)) {
      toast({ title: "Invalid MPIN", description: "New MPIN must be 4 digits", variant: "destructive" });
      return;
    }

    if (newMpin !== confirmNewMpin) {
      toast({ title: "MPIN Mismatch", description: "New MPIN and confirmation do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const mpinHash = await hashMPIN(newMpin);
      const { error } = await supabase
        .from('profiles')
        .update({ mpin_hash: mpinHash, failed_mpin_attempts: 0, last_failed_attempt: null, mpin_locked_until: null })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: "MPIN Reset Successfully", description: "Your MPIN has been updated." });
      closeDialog();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reset MPIN", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setShowSecurityDialog(false);
    setCurrentMpin("");
    setNewMpin("");
    setConfirmNewMpin("");
    setSecurityVerified(false);
    setVerificationMethod(null);
    setOtpSent(false);
  };

  const [otpCode, setOtpCode] = useState("");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Reset MPIN
          </CardTitle>
          <CardDescription>Change your MPIN for security purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowSecurityDialog(true)} className="w-full">
            <Lock className="h-4 w-4 mr-2" /> Reset MPIN
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showSecurityDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Reset MPIN
            </DialogTitle>
            <DialogDescription>
              {!verificationMethod
                ? "Choose how to verify your identity"
                : securityVerified
                ? "Enter your new 4-digit MPIN"
                : verificationMethod === 'pin'
                ? "Enter your current MPIN"
                : otpSent
                ? "Enter the OTP sent to your email"
                : "We'll send a verification code to your email"}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Choose verification method */}
          {!verificationMethod && (
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => setVerificationMethod('pin')}>
                <Lock className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Verify with Current MPIN</p>
                  <p className="text-xs text-muted-foreground">Enter your existing MPIN</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => setVerificationMethod('otp')}>
                <Mail className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Verify with Email OTP</p>
                  <p className="text-xs text-muted-foreground">Receive a code on your registered email</p>
                </div>
              </Button>
            </div>
          )}

          {/* Step 2a: PIN verification */}
          {verificationMethod === 'pin' && !securityVerified && (
            <form onSubmit={handleVerifyCurrent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-mpin">Current MPIN</Label>
                <Input id="current-mpin" type="password" maxLength={4} value={currentMpin}
                  onChange={(e) => setCurrentMpin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter current MPIN" required autoFocus />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          )}

          {/* Step 2b: OTP verification */}
          {verificationMethod === 'otp' && !securityVerified && (
            <div className="space-y-4">
              {!otpSent ? (
                <Button onClick={handleSendOTP} disabled={loading} className="w-full">
                  {loading ? "Sending..." : "Send OTP to Email"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Enter OTP</Label>
                    <Input type="text" maxLength={6} value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code" autoFocus />
                  </div>
                  <Button onClick={() => handleVerifyOTP(otpCode)} disabled={loading || otpCode.length < 6} className="w-full">
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Set new MPIN */}
          {securityVerified && (
            <form onSubmit={handleResetMPIN} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-mpin">New MPIN (4 digits)</Label>
                <Input id="new-mpin" type="password" maxLength={4} value={newMpin}
                  onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new MPIN" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-mpin">Confirm New MPIN</Label>
                <Input id="confirm-new-mpin" type="password" maxLength={4} value={confirmNewMpin}
                  onChange={(e) => setConfirmNewMpin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter new MPIN" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Resetting..." : "Reset MPIN"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
