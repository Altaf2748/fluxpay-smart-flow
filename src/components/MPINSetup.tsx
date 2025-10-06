import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";

export const MPINSetup = () => {
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const hashMPIN = async (pin: string) => {
    const msgUint8 = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSetMPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mpin.length !== 4 || !/^\d+$/.test(mpin)) {
      toast({
        title: "Invalid MPIN",
        description: "MPIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (mpin !== confirmMpin) {
      toast({
        title: "MPIN Mismatch",
        description: "MPIN and confirmation do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const mpinHash = await hashMPIN(mpin);

      const { error } = await supabase
        .from('profiles')
        .update({ mpin_hash: mpinHash })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "MPIN Set Successfully",
        description: "Your MPIN has been set. You can now make payments.",
      });

      setMpin("");
      setConfirmMpin("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set MPIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Set MPIN
        </CardTitle>
        <CardDescription>
          Set a 4-digit MPIN to secure your payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSetMPIN} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mpin">MPIN (4 digits)</Label>
            <Input
              id="mpin"
              type="password"
              maxLength={4}
              value={mpin}
              onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-digit MPIN"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmMpin">Confirm MPIN</Label>
            <Input
              id="confirmMpin"
              type="password"
              maxLength={4}
              value={confirmMpin}
              onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, ''))}
              placeholder="Re-enter MPIN"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Setting..." : "Set MPIN"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
