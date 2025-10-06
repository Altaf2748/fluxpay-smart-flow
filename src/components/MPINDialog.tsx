import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface MPINDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mpin: string) => void;
  loading?: boolean;
}

export const MPINDialog = ({ open, onOpenChange, onConfirm, loading }: MPINDialogProps) => {
  const [mpin, setMpin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mpin.length === 4) {
      onConfirm(mpin);
      setMpin("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Enter MPIN
          </DialogTitle>
          <DialogDescription>
            Enter your 4-digit MPIN to confirm this payment
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-mpin">MPIN</Label>
            <Input
              id="payment-mpin"
              type="password"
              maxLength={4}
              value={mpin}
              onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-digit MPIN"
              autoFocus
              required
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMpin("");
                onOpenChange(false);
              }}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || mpin.length !== 4}>
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
