import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Calendar, CreditCard, Smartphone, Users, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Offer {
  id: number;
  title: string;
  description: string;
  validUntil: string;
  minAmount: number;
  maxCashback: number;
  category: string;
  rail: string;
}

export const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data: response, error } = await supabase.functions.invoke('get-offers');

      if (error) throw error;

      setOffers(response.offers || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch offers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRailIcon = (rail: string) => {
    switch (rail) {
      case 'UPI':
        return <Smartphone className="w-4 h-4" />;
      case 'CARD':
        return <CreditCard className="w-4 h-4" />;
      case 'UPI_P2P':
        return <Users className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getRailColor = (rail: string) => {
    switch (rail) {
      case 'UPI':
        return 'bg-blue-100 text-blue-800';
      case 'CARD':
        return 'bg-green-100 text-green-800';
      case 'UPI_P2P':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Gift className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-text">Special Offers</h1>
          <p className="text-muted-foreground">Exclusive deals and cashback offers</p>
        </div>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Gift className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No active offers available at the moment.<br />
              Check back soon for new deals!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="relative overflow-hidden">
              {isExpiringSoon(offer.validUntil) && (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs font-semibold">
                  Expiring Soon
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{offer.title}</CardTitle>
                    <CardDescription>{offer.description}</CardDescription>
                  </div>
                  <Badge className={`ml-2 ${getRailColor(offer.rail)}`}>
                    <div className="flex items-center gap-1">
                      {getRailIcon(offer.rail)}
                      {offer.rail === 'ANY' ? 'ALL' : offer.rail}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Min Amount:</span>
                    <span className="font-semibold">₹{offer.minAmount}</span>
                  </div>
                  
                  {offer.maxCashback > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max Cashback:</span>
                      <span className="font-semibold text-green-600">₹{offer.maxCashback}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valid Until:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(offer.validUntil)}
                    </span>
                  </div>
                </div>
                
                <Button className="w-full" size="sm">
                  Activate Offer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};