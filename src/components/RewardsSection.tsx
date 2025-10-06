import React, { useEffect, useState } from 'react';
import { Star, TrendingUp, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RedemptionDialog } from '@/components/RedemptionDialog';

export const RewardsSection = () => {
  const [totalRewards, setTotalRewards] = useState({ cashback: 0, points: 0 });
  const [recentRewards, setRecentRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRedemption, setShowRedemption] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch total rewards
      const { data: rewards, error } = await supabase
        .from('rewards_ledger')
        .select('cashback, points, created_at, transactions(merchant, amount)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (rewards) {
        const total = rewards.reduce(
          (acc, r) => ({
            cashback: acc.cashback + parseFloat(r.cashback.toString()),
            points: acc.points + r.points
          }),
          { cashback: 0, points: 0 }
        );
        setTotalRewards(total);
        setRecentRewards(rewards.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rewards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Rewards</h1>

      {/* Total Rewards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Gift className="w-5 h-5 mr-2" />
              Total Cashback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {loading ? '₹••••' : `₹${totalRewards.cashback.toFixed(2)}`}
            </div>
            <p className="text-green-100 mt-2">Earned from all transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Star className="w-5 h-5 mr-2" />
              Reward Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-3">
              {loading ? '•••••' : totalRewards.points.toLocaleString()}
            </div>
            <p className="text-orange-100 mb-4">Available to redeem</p>
            <Button 
              onClick={() => setShowRedemption(true)}
              disabled={loading || totalRewards.points < 100}
              className="w-full bg-white text-orange-600 hover:bg-orange-50"
            >
              <Gift className="w-4 h-4 mr-2" />
              Redeem Points
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recent Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : recentRewards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rewards yet. Make your first payment to start earning!
            </div>
          ) : (
            <div className="space-y-3">
              {recentRewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {reward.transactions?.merchant || 'Transaction'}
                    </p>
                    <p className="text-sm text-gray-500">
                      ₹{parseFloat(reward.transactions?.amount || 0).toFixed(2)} transaction
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +₹{parseFloat(reward.cashback).toFixed(2)}
                    </p>
                    <p className="text-sm text-yellow-600">+{reward.points} pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showRedemption && (
        <RedemptionDialog
          availablePoints={totalRewards.points}
          onClose={() => setShowRedemption(false)}
          onSuccess={fetchRewards}
        />
      )}
    </div>
  );
};
