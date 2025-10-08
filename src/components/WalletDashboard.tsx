
import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, TrendingUp, Star, Eye, EyeOff, Zap, Plus, BarChart3, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WalletDashboardProps {
  onNavigateToPayment?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToOffers?: () => void;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ 
  onNavigateToPayment, 
  onNavigateToSettings,
  onNavigateToAnalytics,
  onNavigateToOffers 
}) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [userName, setUserName] = useState('User');
  const [balances, setBalances] = useState({ upiBalance: 0, cardBalance: 0, cardCreditLimit: 0 });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBalances();
    fetchRecentTransactions();
    
    // Listen for balance update events from other components
    const handleBalanceUpdate = () => {
      fetchBalances();
      fetchRecentTransactions();
    };
    
    window.addEventListener('balance-updated', handleBalanceUpdate);
    
    // Refresh balances when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBalances();
        fetchRecentTransactions();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('balance-updated', handleBalanceUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Fetch user profile for name and balance
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, balance, card_balance')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;

      if (profile) {
        setUserName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User');
        setBalances({
          upiBalance: profile.balance || 0,
          cardBalance: profile.card_balance || 0,
          cardCreditLimit: 0
        });
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch account balances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      // Fetch sender names for received P2P transactions
      const formattedTransactions = await Promise.all(
        (data || []).map(async (txn) => {
          const isReceived = txn.recipient_id === user.id && txn.transaction_type === 'p2p';
          let merchantName = txn.merchant;

          if (isReceived) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', txn.user_id)
              .single();
            
            if (senderProfile) {
              const senderName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
              merchantName = `From ${senderName || txn.merchant}`;
            } else {
              merchantName = `From ${txn.merchant}`;
            }
          }

          return {
            id: txn.id,
            merchant: merchantName,
            amount: isReceived ? txn.amount : -txn.amount,
            type: txn.rail,
            reward: txn.reward_amount || 0,
            time: getTimeAgo(txn.created_at)
          };
        })
      );

      setRecentTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {userName}!</h1>
        <p className="text-gray-600">Here's your financial overview</p>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Main Balance */}
        <Card className="md:col-span-2 bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-blue-100 text-sm font-medium">Total Balance</CardTitle>
                <div className="flex items-center mt-2">
                  <span className="text-3xl font-bold">
                    {loading ? '₹***,***' : balanceVisible ? `₹${(balances.upiBalance + balances.cardBalance).toLocaleString()}` : '₹***,***'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="ml-2 text-white hover:bg-white/20"
                  >
                    {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-0">Gold Tier</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">UPI Balance</p>
                  <p className="font-semibold">{loading ? '₹••••' : `₹${balances.upiBalance.toLocaleString()}`}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Card Balance</p>
                  <p className="font-semibold">{loading ? '₹••••' : `₹${balances.cardBalance.toLocaleString()}`}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Card */}
        <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0">
          <CardHeader>
            <CardTitle className="text-orange-100 text-sm font-medium flex items-center">
              <Star className="w-4 h-4 mr-1" />
              Rewards Points
            </CardTitle>
            <div className="text-2xl font-bold">2,847</div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-orange-100">This Month</span>
                <span>+247 pts</span>
              </div>
              <Button size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-0">
                Redeem Points
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Button 
          className="h-16 bg-blue-600 hover:bg-blue-700 flex-col space-y-1"
          onClick={onNavigateToPayment}
        >
          <Zap className="w-5 h-5" />
          <span className="text-sm">Quick Pay</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-16 flex-col space-y-1"
          onClick={onNavigateToSettings}
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Add Card</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-16 flex-col space-y-1"
          onClick={onNavigateToAnalytics}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-sm">Analytics</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-16 flex-col space-y-1"
          onClick={onNavigateToOffers}
        >
          <Gift className="w-5 h-5" />
          <span className="text-sm">Offers</span>
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    txn.type === 'UPI' ? 'bg-blue-100 text-blue-600' :
                    txn.type === 'Card' ? 'bg-purple-100 text-purple-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {txn.type === 'UPI' ? <Smartphone className="w-4 h-4" /> : 
                     txn.type === 'Card' ? <CreditCard className="w-4 h-4" /> :
                     <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{txn.merchant}</p>
                    <p className="text-sm text-gray-500">{txn.time} • {txn.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${txn.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount)}
                  </p>
                  {txn.reward > 0 && (
                    <p className="text-sm text-yellow-600">+{txn.reward} pts</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
