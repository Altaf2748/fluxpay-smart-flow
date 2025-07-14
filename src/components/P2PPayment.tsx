import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResolvedContact {
  name: string;
  upiId: string;
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
  const { toast } = useToast();

  const validateIdentifier = (value: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return mobileRegex.test(value) || upiRegex.test(value);
  };

  const resolveContact = async () => {
    if (!validateIdentifier(identifier)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid mobile number or UPI ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setResolving(true);
      const { data: response, error } = await supabase.functions.invoke('resolve-upi', {
        body: JSON.stringify({ identifier })
      });

      if (error) throw error;

      if (response.success) {
        setResolvedContact({
          name: response.name,
          upiId: response.upiId,
          verified: response.verified
        });
        setStep('confirm');
        toast({
          title: "Contact Found",
          description: `Found ${response.name}`,
        });
      } else {
        toast({
          title: "Contact Not Found",
          description: response.error || "Could not resolve the UPI ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resolving contact:', error);
      toast({
        title: "Error",
        description: "Failed to resolve contact details",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  const processPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: response, error } = await supabase.functions.invoke('pay-p2p', {
        body: JSON.stringify({
          recipientName: resolvedContact?.name,
          recipientUpi: resolvedContact?.upiId,
          amount: parseFloat(amount),
          note: note.trim() || undefined
        })
      });

      if (error) throw error;

      setResult(response);
      setStep('result');

      if (response.success) {
        toast({
          title: "Payment Successful",
          description: `₹${amount} sent to ${resolvedContact?.name}`,
        });
      } else {
        toast({
          title: "Payment Failed",
          description: "The payment could not be processed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
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
                Enter mobile number or UPI ID to send money
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="identifier">Mobile Number or UPI ID</Label>
                <Input
                  id="identifier"
                  placeholder="9876543210 or user@paytm"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
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
                    <p className="text-sm text-muted-foreground">{resolvedContact.upiId}</p>
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
                  onClick={processPayment} 
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
              </div>

              <Button onClick={resetForm} className="w-full">
                Send Another Payment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};