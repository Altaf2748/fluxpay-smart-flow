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
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Your Rewards</h1>

      {/* Total Rewards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="gradient-primary text-primary-foreground border-0 overflow-hidden relative">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/5" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center text-primary-foreground text-sm sm:text-base">
              <Gift className="w-5 h-5 mr-2" />
              Total Cashback
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl sm:text-4xl font-bold">
              {loading ? '₹••••' : `₹${totalRewards.cashback.toFixed(2)}`}
            </div>
            <p className="text-primary-foreground/70 mt-2 text-sm">Earned from all transactions</p>
          </CardContent>
        </Card>

        <Card className="gradient-gold text-primary-foreground border-0 overflow-hidden relative">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center text-primary-foreground text-sm sm:text-base">
              <Star className="w-5 h-5 mr-2" />
              Reward Points
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl sm:text-4xl font-bold mb-3">
              {loading ? '•••••' : totalRewards.points.toLocaleString()}
            </div>
            <p className="text-primary-foreground/70 mb-4 text-sm">Available to redeem</p>
            <Button 
              onClick={() => setShowRedemption(true)}
              disabled={loading || totalRewards.points < 100}
              className="w-full bg-white/20 hover:bg-white/30 text-primary-foreground border-0 backdrop-blur-sm"
            >
              <Gift className="w-4 h-4 mr-2" />
              Redeem Points
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rewards */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recent Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : recentRewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No rewards yet. Make your first payment to start earning!
            </div>
          ) : (
            <div className="space-y-3">
              {recentRewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 sm:p-4 bg-muted/30 rounded-xl border border-border/30"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {reward.transactions?.merchant || 'Transaction'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₹{parseFloat(reward.transactions?.amount || 0).toFixed(2)} transaction
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-semibold text-sm text-primary">
                      +₹{parseFloat(reward.cashback).toFixed(2)}
                    </p>
                    <p className="text-xs text-amber-600">+{reward.points} pts</p>
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
