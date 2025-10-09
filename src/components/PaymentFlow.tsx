
import React, { useState } from 'react';
import { ArrowRight, Smartphone, CreditCard, Zap, AlertCircle, CheckCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const { toast } = useToast();

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

  const handleMpinConfirm = async (mpin: string) => {
    setShowMpinDialog(false);
    setPaymentLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          merchant,
          amount: parseFloat(amount),
          rail: selectedMethod,
          mpin,
          couponCode: couponCode?.trim() || null
        }
      });

      if (error) throw error;

      setPaymentResult(data);
      setPaymentComplete(true);

      if (data.success) {
        toast({
          title: "Payment Successful!",
          description: `₹${amount} paid to ${merchant}`,
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
                ? `₹${amount} paid to ${merchant}` 
                : paymentResult.message
              }
            </p>
            {paymentResult.success && paymentResult.rewards && (
              <div className="bg-white rounded-lg p-4 mb-6">
                {paymentResult.rewards.couponApplied && (
                  <div className="flex items-center justify-between text-sm mb-3 pb-3 border-b">
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-green-600" />
                      Coupon Applied
                    </span>
                    <span className="font-semibold text-green-600">
                      {paymentResult.rewards.offerTitle}
                    </span>
                  </div>
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
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            FluxPay Checkout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Merchant Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant or Recipient
            </label>
            <div className="space-y-2">
              <Input
                type="text"
                value={merchant}
                onChange={(e) => {
                  setMerchant(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search merchant (e.g., Starbucks, Amazon)"
                className="h-12"
                disabled={paymentLoading}
              />
              
              {/* Always visible merchant grid */}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                {filteredMerchants.slice(0, 20).map((merchantName) => (
                  <button
                    key={merchantName}
                    type="button"
                    onClick={() => {
                      setMerchant(merchantName);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-2 text-sm rounded-md transition-all ${
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
            </div>
          </div>

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
                className="pl-8 text-lg h-12"
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
              placeholder="Enter coupon code"
              className="h-12 uppercase"
              disabled={paymentLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Apply a coupon code from offers to get additional cashback
            </p>
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
                  Pay ₹{amount} with {paymentMethods.find(m => m.id === selectedMethod)?.name}
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
