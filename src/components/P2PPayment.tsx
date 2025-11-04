import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, CheckCircle, XCircle, Loader2, QrCode, Scan } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if there's a scanned recipient from QR code
    const scannedData = sessionStorage.getItem('scannedRecipient');
    if (scannedData) {
      try {
        const recipient = JSON.parse(scannedData);
        setIdentifier(recipient.phone);
        // Auto-resolve the contact
        resolveContactByPhone(recipient.phone);
        // Clear the session storage
        sessionStorage.removeItem('scannedRecipient');
      } catch (error) {
        console.error('Error parsing scanned recipient:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (html5QrCode && isScanning) {
        html5QrCode.stop().catch((err) => {
          console.log('Scanner cleanup:', err.message);
        });
      }
    };
  }, []);

  const validateIdentifier = (value: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(value);
  };

  const startQRScanner = async () => {
    try {
      // Check if browser supports camera access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera Not Supported",
          description: "Your browser doesn't support camera access. Please use a modern browser.",
          variant: "destructive",
        });
        return;
      }

      // Set scanning state first, then wait for next frame to ensure DOM is ready
      setIsScanning(true);
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const qrCode = new Html5Qrcode("qr-reader");
      setHtml5QrCode(qrCode);

      // Start scanner with better mobile support
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await qrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          try {
            const qrData = JSON.parse(decodedText);
            if (qrData.type === 'fluxpay' && qrData.phone) {
              setIdentifier(qrData.phone);
              await qrCode.stop();
              setIsScanning(false);
              setHtml5QrCode(null);
              
              // Auto-resolve the contact
              await resolveContactByPhone(qrData.phone);
            } else {
              toast({
                title: "Invalid QR Code",
                description: "This is not a valid FluxPay QR code",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('QR scan error:', error);
          }
        },
        (errorMessage) => {
          // Ignore scan errors as they happen frequently
          console.log('QR scan ongoing...');
        }
      );
    } catch (error: any) {
      console.error('Failed to start scanner:', error);
      
      let errorTitle = "Camera Error";
      let errorMessage = "Could not access camera. Please try again.";
      
      if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission')) {
        errorTitle = "Permission Required";
        errorMessage = "Please allow camera access in your browser settings. On iPhone: Settings > Safari > Camera. On Android: Browser > Settings > Site Settings > Camera.";
      } else if (error?.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error?.name === 'NotReadableError') {
        errorMessage = "Camera is being used by another application. Please close other apps and try again.";
      } else if (error?.name === 'NotSupportedError' || error?.message?.includes('secure')) {
        errorMessage = "Camera requires HTTPS connection. Please access the app via a secure connection.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
      setIsScanning(false);
      setHtml5QrCode(null);
    }
  };

  const stopQRScanner = async () => {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop();
      } catch (error: any) {
        console.log('Stop scanner error:', error.message);
      }
      setHtml5QrCode(null);
      setIsScanning(false);
    }
  };

  const resolveContactByPhone = async (phone: string) => {
    if (!validateIdentifier(phone)) {
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
        body: { identifier: phone }
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

  const resolveContact = async () => {
    await resolveContactByPhone(identifier);
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
                  Enter mobile number or scan QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="manual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">
                      <Search className="w-4 h-4 mr-2" />
                      Manual
                    </TabsTrigger>
                    <TabsTrigger value="scan">
                      <Scan className="w-4 h-4 mr-2" />
                      Scan QR
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="manual" className="space-y-4">
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
                  </TabsContent>

                  <TabsContent value="scan" className="space-y-4">
                    <div className="text-center text-muted-foreground text-sm mb-4">
                      Scan a FluxPay QR code to send money instantly
                    </div>
                    
                    {/* Always render the QR reader div for camera access */}
                    <div id="qr-reader" className={`w-full rounded-lg overflow-hidden border-2 border-primary ${isScanning ? 'block' : 'hidden'}`}></div>
                    
                    {!isScanning ? (
                      <Button 
                        onClick={startQRScanner} 
                        className="w-full"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopQRScanner} 
                        variant="outline"
                        className="w-full"
                      >
                        Cancel Scan
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
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
