import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Smartphone, TrendingUp, Star, Eye, EyeOff, Zap, Plus, BarChart3, Gift, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletDashboardProps {
  onNavigateToPayment?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToOffers?: () => void;
}

interface BalanceChange {
  type: 'upi' | 'card' | 'total';
  amount: number; // negative = deducted, positive = received
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ 
  onNavigateToPayment, 
  onNavigateToSettings,
  onNavigateToAnalytics,
  onNavigateToOffers 
}) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [userName, setUserName] = useState('User');
  const [balances, setBalances] = useState<{ upiBalance: number | null; cardBalance: number | null; cardCreditLimit: number }>({ upiBalance: null, cardBalance: null, cardCreditLimit: 0 });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [balanceChanges, setBalanceChanges] = useState<BalanceChange[]>([]);
  const prevBalancesRef = useRef<{ upi: number | null; card: number | null }>({ upi: null, card: null });
  const { toast } = useToast();

  useEffect(() => {
    fetchBalances();
    fetchRecentTransactions();
    const handleBalanceUpdate = () => { fetchBalances(); fetchRecentTransactions(); };
    window.addEventListener('balance-updated', handleBalanceUpdate);
    const handleVisibilityChange = () => { if (!document.hidden) { fetchBalances(); fetchRecentTransactions(); } };
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
      const { data: profile, error } = await supabase.from('profiles').select('first_name, last_name, balance, card_balance').eq('user_id', user.id).single();
      if (error) throw error;
      if (profile) {
        setUserName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User');
        
        const newUpi = profile.balance;
        const newCard = profile.card_balance;
        const prevUpi = prevBalancesRef.current.upi;
        const prevCard = prevBalancesRef.current.card;

        // Detect balance changes (skip initial load)
        const changes: BalanceChange[] = [];
        if (prevUpi !== null && newUpi !== null && newUpi !== prevUpi) {
          changes.push({ type: 'upi', amount: newUpi - prevUpi });
        }
        if (prevCard !== null && newCard !== null && newCard !== prevCard) {
          changes.push({ type: 'card', amount: newCard - prevCard });
        }
        if (changes.length > 0) {
          setBalanceChanges(changes);
          setTimeout(() => setBalanceChanges([]), 3000);
        }

        prevBalancesRef.current = { upi: newUpi, card: newCard };
        setBalances({ upiBalance: newUpi, cardBalance: newCard, cardCreditLimit: 0 });
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast({ title: "Error", description: "Failed to fetch account balances", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const fetchRecentTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(4);
      if (error) throw error;
      const formattedTransactions = await Promise.all(
        (data || []).map(async (txn) => {
          const isReceived = txn.recipient_id === user.id && txn.transaction_type === 'p2p';
          let merchantName = txn.merchant;
          if (isReceived) {
            const { data: senderProfile } = await supabase.rpc('get_user_display_name', { target_user_id: txn.user_id }).single();
            if (senderProfile) {
              const senderName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
              merchantName = `From ${senderName || txn.merchant}`;
            } else { merchantName = `From ${txn.merchant}`; }
          }
          return { id: txn.id, merchant: merchantName, amount: isReceived ? txn.amount : -txn.amount, type: txn.rail, reward: txn.reward_amount || 0, time: getTimeAgo(txn.created_at), isReceived };
        })
      );
      setRecentTransactions(formattedTransactions);
    } catch (error) { console.error('Error fetching transactions:', error); }
  };

  const getTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const totalBalance = (balances.upiBalance || 0) + (balances.cardBalance || 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{userName}</h1>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {balances.upiBalance === null && balances.cardBalance === null ? (
          <Card className="lg:col-span-2 glass glass-hover border-dashed border-2 border-primary/30">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mb-4 shadow-lg">
                <Zap className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Account Not Activated</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Your wallet hasn't been set up yet. Contact admin to activate.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2 gradient-primary text-primary-foreground border-0 overflow-hidden relative glow">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/5" />
            <CardHeader className="pb-4 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-medium text-primary-foreground/70 mb-1">Total Balance</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-bold tracking-tight">
                      {loading ? '₹•••••' : balanceVisible ? `₹${totalBalance.toLocaleString()}` : '₹•••••'}
                    </span>
                    <button
                      onClick={() => setBalanceVisible(!balanceVisible)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Badge className="bg-white/15 text-primary-foreground border-white/20 backdrop-blur-sm text-xs">
                  ✦ Gold Tier
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <div className="p-2 bg-white/15 rounded-lg">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/70">UPI</p>
                    <motion.p
                      key={balances.upiBalance}
                      initial={{ scale: 1.15, color: '#facc15' }}
                      animate={{ scale: 1, color: '#ffffff' }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="font-semibold text-sm"
                    >
                      {loading ? '₹••••' : `₹${(balances.upiBalance || 0).toLocaleString()}`}
                    </motion.p>
                  </div>
                  <AnimatePresence>
                    {balanceChanges.find(c => c.type === 'upi') && (
                      <motion.span
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -24 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: 'easeOut' }}
                        className={`absolute -top-1 right-2 text-xs font-bold ${
                          balanceChanges.find(c => c.type === 'upi')!.amount < 0
                            ? 'text-red-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        {balanceChanges.find(c => c.type === 'upi')!.amount < 0 ? '' : '+'}
                        ₹{Math.abs(balanceChanges.find(c => c.type === 'upi')!.amount).toLocaleString()}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="relative flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <div className="p-2 bg-white/15 rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/70">Card</p>
                    <motion.p
                      key={balances.cardBalance}
                      initial={{ scale: 1.15, color: '#facc15' }}
                      animate={{ scale: 1, color: '#ffffff' }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="font-semibold text-sm"
                    >
                      {loading ? '₹••••' : `₹${(balances.cardBalance || 0).toLocaleString()}`}
                    </motion.p>
                  </div>
                  <AnimatePresence>
                    {balanceChanges.find(c => c.type === 'card') && (
                      <motion.span
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -24 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: 'easeOut' }}
                        className={`absolute -top-1 right-2 text-xs font-bold ${
                          balanceChanges.find(c => c.type === 'card')!.amount < 0
                            ? 'text-red-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        {balanceChanges.find(c => c.type === 'card')!.amount < 0 ? '' : '+'}
                        ₹{Math.abs(balanceChanges.find(c => c.type === 'card')!.amount).toLocaleString()}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rewards Card */}
        <Card className="gradient-gold text-primary-foreground border-0 overflow-hidden relative">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              Reward Points
            </CardTitle>
            <div className="text-3xl font-bold tracking-tight">2,847</div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-primary-foreground/70">This month</span>
                <span className="font-medium">+247 pts</span>
              </div>
              <Button size="sm" className="w-full bg-white/20 hover:bg-white/30 text-primary-foreground border-0 backdrop-blur-sm">
                Redeem Points
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Quick Pay', icon: Zap, onClick: onNavigateToPayment, variant: 'primary' as const },
          { label: 'Add Card', icon: Plus, onClick: onNavigateToSettings, variant: 'outline' as const },
          { label: 'Analytics', icon: BarChart3, onClick: onNavigateToAnalytics, variant: 'outline' as const },
          { label: 'Offers', icon: Gift, onClick: onNavigateToOffers, variant: 'outline' as const },
        ].map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
              action.variant === 'primary'
                ? 'gradient-primary text-primary-foreground border-transparent glow hover:opacity-90'
                : 'glass glass-hover border-border/50 text-foreground hover:border-primary/30'
            }`}
          >
            <action.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card className="glass border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <span className="text-xs text-muted-foreground font-medium">Last 4</span>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTransactions.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet</p>
            )}
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    txn.amount > 0
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {txn.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{txn.merchant}</p>
                    <p className="text-xs text-muted-foreground">{txn.time} · {txn.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${txn.amount > 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                    {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                  </p>
                  {txn.reward > 0 && (
                    <p className="text-xs text-amber-600 font-medium">+{txn.reward} pts</p>
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
