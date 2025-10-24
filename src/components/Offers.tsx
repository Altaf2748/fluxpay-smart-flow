// src/pages/Offers.tsx  (or replace your existing src/components/Offers.tsx)
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Calendar, CreditCard, Smartphone, Users, Star, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Offer {
  id: number;
  title: string;
  description: string;
  validUntil: string | null;
  minAmount: number;
  maxCashback: number;
  category: string;
  rail: string;
  redeemCode: string;
}

const OFFERS: Offer[] = [
  {
    id: 1,
    title: "Amazon Sale - 20% Cashback",
    description: "Get 20% cashback on Amazon purchases using FluxPay",
    validUntil: null,
    minAmount: 500,
    maxCashback: 500,
    category: "ecommerce",
    rail: "UPI",
    redeemCode: "AMAZON20"
  },
  {
    id: 2,
    title: "Flipkart Big Billion Days",
    description: "Exclusive 15% cashback on Flipkart with FluxPay UPI",
    validUntil: null,
    minAmount: 1000,
    maxCashback: 1000,
    category: "ecommerce",
    rail: "UPI",
    redeemCode: "FLIPKART15"
  },
  {
    id: 3,
    title: "Swiggy Food Fest - 25% Off",
    description: "Enjoy 25% cashback on all Swiggy orders",
    validUntil: null,
    minAmount: 200,
    maxCashback: 200,
    category: "food",
    rail: "UPI",
    redeemCode: "SWIGGY25"
  },
  {
    id: 4,
    title: "Zomato Gold Offer",
    description: "Get 25% cashback on Zomato dining and delivery",
    validUntil: null,
    minAmount: 300,
    maxCashback: 300,
    category: "food",
    rail: "UPI",
    redeemCode: "ZOMATO25"
  },
  {
    id: 5,
    title: "Nike Store - Flat 20% Back",
    description: "Shop Nike shoes and apparel with 20% cashback",
    validUntil: null,
    minAmount: 2000,
    maxCashback: 1000,
    category: "retail",
    rail: "CARD",
    redeemCode: "NIKE20"
  },
  {
    id: 6,
    title: "Myntra Fashion Sale",
    description: "Myntra fashion haul with 20% instant cashback",
    validUntil: null,
    minAmount: 1500,
    maxCashback: 800,
    category: "fashion",
    rail: "CARD",
    redeemCode: "MYNTRA20"
  },
  {
    id: 7,
    title: "BookMyShow Movie Bonanza",
    description: "25% cashback on movie ticket bookings",
    validUntil: null,
    minAmount: 300,
    maxCashback: 200,
    category: "entertainment",
    rail: "CARD",
    redeemCode: "BMS25"
  },
  {
    id: 8,
    title: "Uber Rides Discount",
    description: "Get 15% cashback on all Uber rides",
    validUntil: null,
    minAmount: 100,
    maxCashback: 150,
    category: "transport",
    rail: "UPI",
    redeemCode: "UBER15"
  },
  {
    id: 9,
    title: "Big Bazaar Grocery Deals",
    description: "Save 10% on grocery shopping at Big Bazaar",
    validUntil: null,
    minAmount: 500,
    maxCashback: 300,
    category: "grocery",
    rail: "UPI",
    redeemCode: "BIGB10"
  },
  {
    id: 10,
    title: "Reliance Digital Electronics",
    description: "Massive 10% cashback on electronics and gadgets",
    validUntil: null,
    minAmount: 5000,
    maxCashback: 2000,
    category: "electronics",
    rail: "CARD",
    redeemCode: "RELIANCE10"
  },
  {
    id: 11,
    title: "Decathlon Sports Sale",
    description: "Get 20% back on sports equipment and gear",
    validUntil: null,
    minAmount: 1000,
    maxCashback: 500,
    category: "sports",
    rail: "UPI",
    redeemCode: "DECATHLON20"
  },
  {
    id: 12,
    title: "Nykaa Beauty Bonanza",
    description: "25% cashback on beauty and cosmetics",
    validUntil: null,
    minAmount: 800,
    maxCashback: 400,
    category: "beauty",
    rail: "CARD",
    redeemCode: "NYKAA25"
  }
];

export const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // load the static offers into state
    setOffers(OFFERS);
  }, []);

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const handleActivateOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setCopied(false);
  };

  const handleCopyCode = async () => {
    if (selectedOffer?.redeemCode) {
      await navigator.clipboard.writeText(selectedOffer.redeemCode);
      setCopied(true);
      toast({
        title: "Code Copied!",
        description: "Use this code when making a payment",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
                
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => handleActivateOffer(offer)}
                >
                  Activate Offer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              {selectedOffer?.title}
            </DialogTitle>
            <DialogDescription>
              Use this code when making a payment to {selectedOffer?.category}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Coupon Code</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-2xl font-bold tracking-wider">
                  {selectedOffer?.redeemCode}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Cashback:</span>
                <span className="font-semibold text-green-600">
                  ₹{selectedOffer?.maxCashback}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid Until:</span>
                <span className="font-semibold">
                  {selectedOffer && formatDate(selectedOffer.validUntil)}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This code is unique to this offer. Apply it during payment to receive the cashback.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Offers;
