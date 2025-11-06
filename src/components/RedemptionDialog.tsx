import React, { useState } from 'react';
import { Gift, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RedemptionDialogProps {
  availablePoints: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const RedemptionDialog = ({ availablePoints, onClose, onSuccess }: RedemptionDialogProps) => {
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const cashValue = parseInt(points || '0') / 10; // 10 points = ₹1

  const handleRedeem = async () => {
    const pointsToRedeem = parseInt(points);
    
    if (!pointsToRedeem || pointsToRedeem < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum 100 points required for redemption",
        variant: "destructive",
      });
      return;
    }

    if (pointsToRedeem > availablePoints) {
      toast({
        title: "Insufficient Points",
        description: "You don't have enough points",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a redemption transaction
      const { error: txnError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          merchant: 'Points Redemption',
          amount: cashValue,
          rail: 'REDEMPTION',
          status: 'success',
          reward_amount: -pointsToRedeem,
          transaction_ref: `RED${Date.now()}`
        });

      if (txnError) throw txnError;

      // Get current balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Update user balance
      const newBalance = Number(profile.balance) + cashValue;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      // Record the point deduction in rewards ledger
      const { error: rewardsError } = await supabase
        .from('rewards_ledger')
        .insert({
          user_id: user.id,
          cashback: 0,
          points: -pointsToRedeem
        });

      if (rewardsError) throw rewardsError;

      setSuccess(true);
      toast({
        title: "Redemption Successful!",
        description: `₹${cashValue.toFixed(2)} credited to your wallet`,
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Redemption error:', error);
      toast({
        title: "Redemption Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-green-50 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Success!</h2>
            <p className="text-green-600 mb-2">₹{cashValue.toFixed(2)} credited to your wallet</p>
            <p className="text-sm text-green-600">{points} points redeemed</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="w-5 h-5 mr-2 text-yellow-600" />
            Redeem Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 mb-1">Available Points</p>
            <p className="text-3xl font-bold text-yellow-600">{availablePoints.toLocaleString()}</p>
            <p className="text-xs text-yellow-600 mt-1">= ₹{(availablePoints / 10).toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points to Redeem (Min: 100)
            </label>
            <Input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Enter points"
              className="text-lg h-12"
              min="100"
              max={availablePoints}
              disabled={loading}
            />
            {points && parseInt(points) >= 100 && (
              <p className="text-sm text-green-600 mt-2">
                You'll receive: ₹{cashValue.toFixed(2)}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Conversion Rate:</strong> 10 points = ₹1
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Redeemed amount will be credited to your wallet instantly
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              onClick={handleRedeem}
              disabled={loading || !points || parseInt(points) < 100}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Redeeming...
                </>
              ) : (
                <>
                  Redeem Points
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
