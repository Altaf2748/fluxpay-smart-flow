import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MPINDialog } from './MPINDialog';

interface ResolvedContact {
  name: string;
  userId: string;
  phone: string;
  verified: boolean;
}

export const P2PPayment = () => {
  const [step, setStep] = useState<'search' | 'confirm' | 'result'>('search');
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [resolvedContact, setResolvedContact] = useState<ResolvedContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showMPINDialog, setShowMPINDialog] = useState(false);
  const { toast } = useToast();

  const validateIdentifier = (value: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(value);
  };

  const resolveContact = async () => {
    if (!validateIdentifier(identifier)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setResolving(true);
    try {
      const { data, error } = await supabase.functions.invoke('resolve-upi', {
        body: { identifier }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "User Not Found",
          description: data.message || "No registered user found with this phone number",
          variant: "destructive",
        });
        return;
      }

      setResolvedContact({
        name: data.name,
        userId: data.userId,
        phone: data.phone,
        verified: data.verified
      });
      setStep('confirm');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve contact",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  const handleConfirmPayment = () => {
    if (!resolvedContact || !amount) {
      toast({
        title: "Missing Information",
        description: "Please provide all required details",
        variant: "destructive",
      });
      return;
    }
    setShowMPINDialog(true);
  };

  const processPayment = async (mpin: string) => {
    setShowMPINDialog(false);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('pay-p2p', {
        body: { 
          recipientId: resolvedContact?.userId,
          amount: parseFloat(amount),
          note: note || 'P2P Payment',
          mpin
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Payment Failed",
          description: data.message || "Transaction could not be completed",
          variant: "destructive",
        });
        setResult({
          success: false,
          amount,
          recipientName: resolvedContact?.name,
          message: data.message
        });
      } else {
        toast({
          title: "Payment Successful",
          description: `₹${amount} sent to ${resolvedContact?.name}`,
        });
        setResult({
          success: true,
          amount,
          recipientName: resolvedContact?.name,
          transactionRef: data.transaction_ref
        });
        // Trigger a storage event to refresh balance across components
        window.dispatchEvent(new Event('balance-updated'));
      }
      
      setStep('result');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Payment processing failed",
        variant: "destructive",
      });
      setResult({
        success: false,
        amount,
        recipientName: resolvedContact?.name
      });
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('search');
    setIdentifier('');
    setAmount('');
    setNote('');
    setResolvedContact(null);
    setResult(null);
  };

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">Send Money</h1>
            <p className="text-muted-foreground">Transfer money to friends and family</p>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {step === 'search' && (
            <Card>
              <CardHeader>
                <CardTitle>Find Contact</CardTitle>
                <CardDescription>
                  Enter mobile number to send money
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="identifier">Mobile Number</Label>
                  <Input
                    id="identifier"
                    placeholder="9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
                    maxLength={10}
                  />
                </div>
                
                <Button 
                  onClick={resolveContact} 
                  disabled={!identifier || resolving}
                  className="w-full"
                >
                  {resolving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Find Contact
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'confirm' && resolvedContact && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Payment</CardTitle>
                <CardDescription>
                  Review payment details before sending
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-semibold">{resolvedContact.name}</p>
                      <p className="text-sm text-muted-foreground">{resolvedContact.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Add a note for this transaction"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('search')} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleConfirmPayment} 
                    disabled={loading || !amount}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      `Send ₹${amount || '0'}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'result' && result && (
            <Card>
              <CardHeader className="text-center">
                {result.success ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <CardTitle className="text-green-600">Payment Successful</CardTitle>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <CardTitle className="text-red-600">Payment Failed</CardTitle>
                  </>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold">₹{result.amount}</p>
                  <p className="text-muted-foreground">
                    {result.success ? 'Sent to' : 'Failed to send to'} {result.recipientName}
                  </p>
                  {result.transactionRef && (
                    <p className="text-xs text-muted-foreground">
                      Ref: {result.transactionRef}
                    </p>
                  )}
                  {result.message && (
                    <p className="text-sm text-destructive">{result.message}</p>
                  )}
                </div>

                <Button onClick={resetForm} className="w-full">
                  Send Another Payment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MPINDialog
        open={showMPINDialog}
        onOpenChange={setShowMPINDialog}
        onConfirm={processPayment}
        loading={loading}
      />
    </>
  );
};
