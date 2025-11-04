
import React, { useState, useEffect } from 'react';
import { ArrowRight, Smartphone, CreditCard, Zap, AlertCircle, CheckCircle, Gift, QrCode, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Html5Qrcode } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MPINDialog } from './MPINDialog';

const FAMOUS_MERCHANTS = [
  'Starbucks', 'Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Netflix', 'Spotify', 'Apple', 
  'Google Play', 'Steam', 'Nike', 'Adidas', 'Zara', 'H&M', 'McDonald\'s', 'KFC', 
  'Domino\'s', 'Pizza Hut', 'Subway', 'Uber', 'Ola', 'BookMyShow', 'PVR Cinemas', 
  'BigBasket', 'Grofers', 'DMart', 'Reliance Digital', 'Croma', 'Samsung', 'OnePlus',
  'Xiaomi', 'Nykaa', 'Myntra', 'Ajio', 'Lifestyle', 'Pantaloons', 'Decathlon', 
  'Titan', 'Tanishq', 'Kalyan Jewellers', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer',
  'Sony', 'LG', 'Philips', 'Boat', 'JBL', 'Bose'
];

export const PaymentFlow = () => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [showRouting, setShowRouting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showMpinDialog, setShowMpinDialog] = useState(false);
  const [showMerchantList, setShowMerchantList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);
  const [appliedOffer, setAppliedOffer] = useState<any>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [scanMode, setScanMode] = useState<'merchant' | 'p2p'>('merchant');
  const { toast } = useToast();

  useEffect(() => {
    fetchOffers();
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

  useEffect(() => {
    // Auto-apply a coupon code whenever merchant and offers are available
    if (merchant && availableOffers.length > 0) {
      // First try to find a matching offer for the merchant
      let matchingOffer = availableOffers.find(offer => {
        const merchantName = merchant.toLowerCase();
        const offerMerchant = offer.title.split(' ')[0].toLowerCase();
        return merchantName.includes(offerMerchant) || offerMerchant.includes(merchantName);
      });

      // If no matching offer, pick a random offer to always give a discount
      if (!matchingOffer && availableOffers.length > 0) {
        matchingOffer = availableOffers[Math.floor(Math.random() * availableOffers.length)];
      }

      if (matchingOffer) {
        console.log('Auto-applying offer:', matchingOffer);
        setCouponCode(matchingOffer.redeem_code);
        setAppliedOffer(matchingOffer);
      }
    } else if (!merchant) {
      setCouponCode("");
      setAppliedOffer(null);
    }
  }, [merchant, availableOffers]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-offers');
      if (error) throw error;
      console.log('Fetched offers:', data?.offers);
      setAvailableOffers(data?.offers || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const amt = parseFloat(value);
    if (amt > 0 && amt <= 100000) {
      setShowRouting(true);
    } else {
      setShowRouting(false);
    }
  };

  const getRoutingRecommendation = () => {
    const amt = parseFloat(amount);
    if (amt <= 1000) {
      return {
        recommended: 'UPI',
        reason: '5% cashback + zero processing fee',
        savings: `₹${Math.round(amt * 0.03)} saved vs card`,
        points: `+${Math.round(amt * 0.05)} bonus points`
      };
    } else {
      return {
        recommended: 'CARD',
        reason: '2% cashback + purchase protection',
        savings: 'Extended warranty included',
        points: `+${Math.round(amt * 0.02)} points`
      };
    }
  };


  const paymentMethods = [
    {
      id: 'UPI',
      name: 'UPI Payment',
      icon: Smartphone,
      recommended: true,
      cashback: '5%',
      description: 'Instant, secure bank transfer'
    },
    {
      id: 'CARD',
      name: 'Credit Card',
      icon: CreditCard,
      recommended: false,
      cashback: '2%',
      description: 'HDFC Bank ****1234'
    }
  ];

  const handleInitiatePayment = () => {
    if (!selectedMethod || !amount || !merchant) {
      toast({
        title: "Invalid Input",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const amt = parseFloat(amount);
    if (amt <= 0 || amt > 100000) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be between ₹1 and ₹100,000",
        variant: "destructive",
      });
      return;
    }

    setShowMpinDialog(true);
  };

  const calculateDiscountedAmount = () => {
    const originalAmount = parseFloat(amount);
    
    // Return zeros if amount is invalid or not entered
    if (isNaN(originalAmount) || originalAmount <= 0) {
      return { original: 0, discount: 0, final: 0, discountPercent: 0 };
    }
    
    // If no offer applied, return original amount with no discount
    if (!appliedOffer) {
      return { original: originalAmount, discount: 0, final: originalAmount, discountPercent: 0 };
    }
    
    // Use the reward_percent from the applied offer
    // reward_percent should be a decimal (e.g., 0.15 for 15%)
    const discountPercent = appliedOffer.reward_percent || 0;
    
    console.log('Calculating discount:', {
      originalAmount,
      discountPercent,
      'discountPercent (as percentage)': (discountPercent * 100) + '%',
      appliedOffer: appliedOffer.title,
      'full offer': appliedOffer
    });
    
    // Calculate discount amount and final amount
    const discountAmount = originalAmount * discountPercent;
    const finalAmount = originalAmount - discountAmount;
    
    console.log('Discount result:', {
      discountAmount,
      finalAmount,
      'savings': discountAmount
    });
    
    return {
      original: originalAmount,
      discount: discountAmount,
      final: finalAmount,
      discountPercent: discountPercent
    };
  };

  const startQRScanner = async (mode: 'merchant' | 'p2p') => {
    try {
      setScanMode(mode);
      
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
      
      const qrCode = new Html5Qrcode("qr-reader-payment");
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
          console.log('QR Code detected:', decodedText);
          
          try {
            // Try to parse as JSON first
            const qrData = JSON.parse(decodedText);
            
            if (qrData.type === 'fluxpay' && qrData.phone) {
              // Stop scanner immediately on successful scan
              await qrCode.stop();
              setIsScanning(false);
              setHtml5QrCode(null);
              
              if (mode === 'p2p') {
                // Store the scanned data and target tab for P2P payment
                sessionStorage.setItem('scannedRecipient', JSON.stringify({
                  phone: qrData.phone,
                  name: qrData.name
                }));
                sessionStorage.setItem('targetTab', 'p2p');
                
                toast({
                  title: "QR Code Scanned",
                  description: `Redirecting to send money to ${qrData.name || qrData.phone}`,
                });
                
                // Reload page to trigger tab change
                setTimeout(() => {
                  window.location.href = '/';
                }, 1000);
              } else {
                // For merchant mode, set the merchant name
                setMerchant(qrData.name || qrData.phone);
                toast({
                  title: "QR Code Scanned",
                  description: `Merchant: ${qrData.name || qrData.phone}`,
                });
              }
            } else {
              // Invalid FluxPay QR code format
              console.log('Invalid FluxPay QR format:', qrData);
              toast({
                title: "Invalid QR Code",
                description: "This is not a valid FluxPay QR code",
                variant: "destructive",
              });
            }
          } catch (parseError) {
            // Not a JSON QR code or invalid JSON
            console.log('QR parse error:', parseError);
            console.log('Raw QR text:', decodedText);
            
            // Check if it's a UPI QR code or other format
            if (decodedText.startsWith('upi://')) {
              toast({
                title: "UPI QR Detected",
                description: "This is a UPI QR code. Please use a FluxPay QR code for payments.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Unsupported QR Code",
                description: "Please scan a valid FluxPay QR code",
                variant: "destructive",
              });
            }
          }
        },
        (errorMessage) => {
          // This is called continuously while scanning - no need to log every frame
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

  const handleMpinConfirm = async (mpin: string) => {
    setShowMpinDialog(false);
    setPaymentLoading(true);

    // Get original amount (before discount)
    const originalAmount = parseFloat(amount);
    
    // Validate amount before proceeding
    if (!originalAmount || originalAmount <= 0 || isNaN(originalAmount)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      setPaymentLoading(false);
      return;
    }

    // Only send coupon code if it's valid and exists in our offers
    let validCouponCode = null;
    if (couponCode?.trim()) {
      const offerExists = availableOffers.some(
        offer => offer.redeem_code === couponCode.trim()
      );
      if (offerExists) {
        validCouponCode = couponCode.trim();
      }
    }

    try {
      // Send ORIGINAL amount to backend - backend will apply discount
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          merchant,
          amount: originalAmount,
          rail: selectedMethod,
          mpin,
          couponCode: validCouponCode
        }
      });

      if (error) throw error;

      setPaymentResult(data);
      setPaymentComplete(true);

      if (data.success) {
        // Store the actual paid amount from backend
        const actualPaidAmount = data.rewards?.finalAmount || data.transaction?.amount || originalAmount;
        setPaidAmount(actualPaidAmount);
        
        toast({
          title: "Payment Successful!",
          description: `₹${actualPaidAmount.toFixed(2)} paid to ${merchant}`,
        });
        // Trigger a storage event to refresh balance across components
        window.dispatchEvent(new Event('balance-updated'));
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setPaymentResult({ success: false, message: error.message });
      setPaymentComplete(true);
    } finally {
      setPaymentLoading(false);
    }
  };

  const resetPayment = () => {
    setPaymentComplete(false);
    setPaymentResult(null);
    setAmount('');
    setMerchant('');
    setCouponCode('');
    setShowRouting(false);
    setSelectedMethod('');
    setPaymentLoading(false);
    setShowMerchantList(false);
    setSearchQuery('');
    setPaidAmount(0);
  };

  const filteredMerchants = FAMOUS_MERCHANTS.filter(m => 
    m.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (paymentComplete && paymentResult) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card className={`text-center ${paymentResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardContent className="p-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              paymentResult.success ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {paymentResult.success ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : (
                <AlertCircle className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              paymentResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
            </h2>
            <p className={`mb-4 ${
              paymentResult.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {paymentResult.success 
                ? `₹${paidAmount.toFixed(2)} paid to ${merchant}` 
                : paymentResult.message
              }
            </p>
            {paymentResult.success && paymentResult.rewards && (
              <div className="bg-white rounded-lg p-4 mb-6">
                {paymentResult.rewards.couponApplied && (
                  <>
                    <div className="flex items-center justify-between text-sm mb-3 pb-3 border-b">
                      <span className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        Coupon Applied
                      </span>
                      <span className="font-semibold text-green-600">
                        {paymentResult.rewards.offerTitle}
                      </span>
                    </div>
                    {paymentResult.rewards.originalAmount && paymentResult.rewards.discountAmount > 0 && (
                      <>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Original Amount:</span>
                          <span className="font-medium text-gray-500 line-through">
                            ₹{paymentResult.rewards.originalAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mb-3 pb-3 border-b">
                          <span className="text-green-600 font-medium">Discount Applied:</span>
                          <span className="font-semibold text-green-600">
                            -₹{paymentResult.rewards.discountAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-base mb-3 pb-3 border-b">
                          <span className="font-bold text-gray-900">Amount Paid:</span>
                          <span className="font-bold text-primary">
                            ₹{paymentResult.rewards.finalAmount.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
                <div className="flex justify-between text-sm mb-2">
                  <span>Cashback Earned</span>
                  <span className="font-semibold text-green-600">
                    ₹{paymentResult.rewards.cashback.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reward Points</span>
                  <span className="font-semibold text-yellow-600">
                    +{paymentResult.rewards.points} pts
                  </span>
                </div>
                {paymentResult.transaction && (
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                    <span>Transaction ID</span>
                    <span className="font-mono text-xs">{paymentResult.transaction.transaction_ref}</span>
                  </div>
                )}
              </div>
            )}
            <Button onClick={resetPayment}>
              Make Another Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            FluxPay Checkout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Merchant Input with Tabs */}
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="search">
                <Smartphone className="w-4 h-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="scan">
                <Scan className="w-4 h-4 mr-2" />
                Scan QR
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merchant or Recipient
              </label>
              <Input
                type="text"
                value={merchant}
                onChange={(e) => {
                  setMerchant(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search merchant"
                className="h-11 sm:h-12"
                disabled={paymentLoading}
              />
              
              {/* Merchant grid */}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                {filteredMerchants.slice(0, 20).map((merchantName) => (
                  <button
                    key={merchantName}
                    type="button"
                    onClick={() => {
                      setMerchant(merchantName);
                      setSearchQuery('');
                    }}
                    className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md transition-all ${
                      merchant === merchantName
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                    }`}
                    disabled={paymentLoading}
                  >
                    {merchantName}
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              <div className="text-center text-muted-foreground text-sm mb-4">
                Scan a FluxPay user QR code to pay them instantly
              </div>
              
              {/* Always render the QR reader div for camera access */}
              <div id="qr-reader-payment" className={`w-full rounded-lg overflow-hidden border-2 border-primary ${isScanning ? 'block' : 'hidden'}`}></div>
              
              {!isScanning ? (
                <Button 
                  onClick={() => startQRScanner('p2p')} 
                  className="w-full h-11 sm:h-12"
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

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Pay
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="pl-8 text-base sm:text-lg h-11 sm:h-12"
                disabled={paymentLoading}
              />
            </div>
          </div>

          {/* Coupon Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code (Optional)
            </label>
            <Input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={appliedOffer ? "Auto-applied" : "Enter coupon code"}
              className="h-11 sm:h-12 uppercase text-sm sm:text-base"
              disabled={paymentLoading}
            />
            {appliedOffer ? (
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Gift className="w-4 h-4" />
                  <span className="font-medium">
                    Discount Auto-Applied
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {appliedOffer.title}
                  </Badge>
                </div>
                {amount && parseFloat(amount) > 0 && !isNaN(parseFloat(amount)) && (() => {
                  const { original, discount, final, discountPercent } = calculateDiscountedAmount();
                  if (original > 0 && !isNaN(discount) && !isNaN(final)) {
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Original Amount:</span>
                          <span className="font-medium text-gray-900">₹{original.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Discount ({Math.round(discountPercent * 100)}%):</span>
                          <span className="font-semibold text-green-600">-₹{discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base pt-2 border-t border-green-300">
                          <span className="font-semibold text-gray-900">Total Amount to Pay:</span>
                          <span className="font-bold text-green-700">₹{final.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Apply a coupon code from offers to get additional discount
              </p>
            )}
          </div>

          {/* Routing Recommendation */}
          {showRouting && (() => {
            const routing = getRoutingRecommendation();
            return (
              <Alert className="border-blue-200 bg-blue-50">
                <Zap className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-blue-800">We recommend {routing.recommended}</p>
                      <p className="text-sm text-blue-600">{routing.reason}</p>
                    </div>
                    <Badge className="bg-blue-600">Best Deal</Badge>
                  </div>
                </AlertDescription>
              </Alert>
            );
          })()}

          {/* Payment Methods */}
          {showRouting && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Choose Payment Method</h3>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    onClick={() => !paymentLoading && setSelectedMethod(method.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${paymentLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${
                          method.recommended ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{method.name}</p>
                            {method.recommended && (
                              <Badge variant="secondary" className="text-xs">Recommended</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{method.cashback}</p>
                        <p className="text-xs text-gray-500">cashback</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pay Button */}
          {selectedMethod && (
            <Button
              onClick={handleInitiatePayment}
              disabled={paymentLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {paymentLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing Payment...
                </>
              ) : (
                <>
                  {(() => {
                    const { final } = calculateDiscountedAmount();
                    return final > 0 && !isNaN(final) 
                      ? `Pay ₹${final.toFixed(2)} with ${paymentMethods.find(m => m.id === selectedMethod)?.name}`
                      : `Pay with ${paymentMethods.find(m => m.id === selectedMethod)?.name}`;
                  })()}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <MPINDialog
        open={showMpinDialog}
        onOpenChange={setShowMpinDialog}
        onConfirm={handleMpinConfirm}
        loading={paymentLoading}
      />
    </div>
  );
};
