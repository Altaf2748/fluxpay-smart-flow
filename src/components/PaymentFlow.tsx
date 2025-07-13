
import React, { useState } from 'react';
import { ArrowRight, Smartphone, CreditCard, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const PaymentFlow = () => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('Starbucks Coffee');
  const [showRouting, setShowRouting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (parseFloat(value) > 0) {
      setShowRouting(true);
    } else {
      setShowRouting(false);
    }
  };

  const routingRecommendation = {
    recommended: 'UPI',
    reason: '5% cashback + lower processing fee',
    savings: '₹14 saved vs card',
    points: '+14 bonus points'
  };

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: Smartphone,
      recommended: true,
      cashback: '5%',
      description: 'Instant, secure bank transfer'
    },
    {
      id: 'card',
      name: 'Credit Card',
      icon: CreditCard,
      recommended: false,
      cashback: '2%',
      description: 'HDFC Bank ****1234'
    }
  ];

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setPaymentComplete(true);
    }, 2000);
  };

  if (paymentComplete) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card className="text-center bg-green-50 border-green-200">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
            <p className="text-green-600 mb-4">₹{amount} paid to {merchant}</p>
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Cashback Earned</span>
                <span className="font-semibold text-green-600">₹{Math.round(parseFloat(amount) * 0.05)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Reward Points</span>
                <span className="font-semibold text-yellow-600">+{Math.round(parseFloat(amount) * 0.05)} pts</span>
              </div>
            </div>
            <Button onClick={() => {setPaymentComplete(false); setAmount(''); setShowRouting(false); setSelectedMethod('');}}>
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
          {/* Merchant Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <p className="font-semibold">{merchant}</p>
              <p className="text-sm text-gray-500">Coffee Shop</p>
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
              />
            </div>
          </div>

          {/* Routing Recommendation */}
          {showRouting && (
            <Alert className="border-blue-200 bg-blue-50">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-800">We recommend UPI</p>
                    <p className="text-sm text-blue-600">{routingRecommendation.reason}</p>
                  </div>
                  <Badge className="bg-blue-600">Best Deal</Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Methods */}
          {showRouting && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Choose Payment Method</h3>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
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
              onClick={handlePayment}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Pay ₹{amount} with {paymentMethods.find(m => m.id === selectedMethod)?.name}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
