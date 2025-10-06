
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MPINSetup } from './MPINSetup';

export const Settings = () => {
  const [vpa, setVpa] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiLoading, setUpiLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [upiLinked, setUpiLinked] = useState(false);
  const [cardLinked, setCardLinked] = useState(false);
  const { toast } = useToast();

  const handleLinkUPI = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('link-payment-method', {
        body: { type: 'UPI', vpa }
      });

      if (error) throw error;

      if (data.success) {
        setUpiLinked(true);
        setVpa('');
        toast({
          title: "UPI Linked Successfully",
          description: "Your UPI VPA has been added to your account.",
        });
      } else {
        throw new Error(data.error || 'Failed to link UPI');
      }
    } catch (error: any) {
      toast({
        title: "UPI Linking Failed",
        description: error.message || "Please check your VPA and try again.",
        variant: "destructive",
      });
    } finally {
      setUpiLoading(false);
    }
  };

  const handleLinkCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('link-payment-method', {
        body: { 
          type: 'CARD', 
          cardNumber, 
          expiryMonth, 
          expiryYear, 
          cvv 
        }
      });

      if (error) throw error;

      if (data.success) {
        setCardLinked(true);
        setCardNumber('');
        setExpiryMonth('');
        setExpiryYear('');
        setCvv('');
        toast({
          title: "Card Linked Successfully",
          description: "Your card has been securely added to your account.",
        });
      } else {
        throw new Error(data.error || 'Failed to link card');
      }
    } catch (error: any) {
      toast({
        title: "Card Linking Failed",
        description: error.message || "Please check your card details and try again.",
        variant: "destructive",
      });
    } finally {
      setCardLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your payment methods and security</p>
      </div>

      {/* MPIN Setup */}
      <MPINSetup />

      <div className="grid md:grid-cols-2 gap-6">
        {/* UPI Linking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
              Link UPI VPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upiLinked ? (
              <div className="flex items-center justify-center py-8 text-green-600">
                <Check className="w-8 h-8 mr-2" />
                <span className="text-lg font-medium">UPI Linked Successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleLinkUPI} className="space-y-4">
                <div>
                  <Label htmlFor="vpa">UPI VPA</Label>
                  <Input
                    id="vpa"
                    type="text"
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value)}
                    placeholder="yourname@paytm"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={upiLoading}
                >
                  {upiLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Link UPI
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Card Linking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
              Link Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cardLinked ? (
              <div className="flex items-center justify-center py-8 text-green-600">
                <Check className="w-8 h-8 mr-2" />
                <span className="text-lg font-medium">Card Linked Successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleLinkCard} className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="expiryMonth">Month</Label>
                    <Input
                      id="expiryMonth"
                      type="text"
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      placeholder="MM"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryYear">Year</Label>
                    <Input
                      id="expiryYear"
                      type="text"
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      placeholder="YY"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={cardLoading}
                >
                  {cardLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Link Card
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
