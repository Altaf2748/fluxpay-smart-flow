import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MPINSetup } from './MPINSetup';
import { MPINReset } from './MPINReset';

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
  const [mpinSet, setMpinSet] = useState(false);
  const [linkedUPI, setLinkedUPI] = useState<any>(null);
  const [linkedCard, setLinkedCard] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkMPINStatus();
    fetchLinkedAccounts();
  }, []);

  const checkMPINStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('mpin_hash')
        .eq('user_id', user.id)
        .single();

      setMpinSet(!!profile?.mpin_hash);
    } catch (error) {
      console.error('Error checking MPIN status:', error);
    }
  };

  const fetchLinkedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: upiData } = await supabase
        .from('linked_banks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const { data: cardData } = await supabase
        .from('linked_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (upiData) {
        setLinkedUPI(upiData);
        setUpiLinked(true);
      }
      
      if (cardData) {
        setLinkedCard(cardData);
        setCardLinked(true);
      }
    } catch (error) {
      console.error('Error fetching linked accounts:', error);
    }
  };

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
        fetchLinkedAccounts();
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
        fetchLinkedAccounts();
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

      {/* MPIN Setup or Reset */}
      {!mpinSet ? (
        <MPINSetup onMPINSet={checkMPINStatus} />
      ) : (
        <MPINReset />
      )}

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
            {upiLinked && linkedUPI ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4 text-green-600">
                  <Check className="w-6 h-6 mr-2" />
                  <span className="font-medium">UPI Linked</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">VPA</p>
                  <p className="font-medium">{linkedUPI.vpa}</p>
                </div>
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
            {cardLinked && linkedCard ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4 text-green-600">
                  <Check className="w-6 h-6 mr-2" />
                  <span className="font-medium">Card Linked</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Card Number</p>
                    <p className="font-medium">**** **** **** {linkedCard.card_last4}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry</p>
                    <p className="font-medium">{linkedCard.expiry_month.toString().padStart(2, '0')}/{linkedCard.expiry_year}</p>
                  </div>
                </div>
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
