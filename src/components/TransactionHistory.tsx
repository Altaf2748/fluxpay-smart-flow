import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  rail: string;
  status: string;
  transaction_ref: string;
  created_at: string;
  user_id: string;
  recipient_id: string | null;
  transaction_type: string;
}

interface TransactionHistoryProps {
  onViewReceipts?: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ onViewReceipts }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transactionsWithNames = await Promise.all(
        (data || []).map(async (txn: any) => {
          if (txn.recipient_id === user.id && txn.transaction_type === 'p2p') {
            const { data: senderProfile } = await supabase
              .rpc('get_user_display_name', { target_user_id: txn.user_id })
              .single();

            if (senderProfile) {
              const senderName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
              return { ...txn, merchant: senderName || txn.merchant };
            }
          }
          return txn;
        })
      );

      setTransactions(transactionsWithNames);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const isReceivedTransaction = (txn: Transaction) => {
    return txn.recipient_id === user?.id && txn.transaction_type === 'p2p';
  };

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions'
        },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Transaction History</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Your recent payment activity</p>
        </div>
        {onViewReceipts && (
          <Button variant="outline" size="sm" onClick={onViewReceipts} className="gap-1.5">
            <Receipt className="w-4 h-4" />
            <span className="hidden sm:inline">Receipts</span>
          </Button>
        )}
      </div>

      {transactions.length === 0 ? (
        <Card className="glass border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted/60 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No transactions yet</h3>
            <p className="text-muted-foreground text-center text-sm">
              Your payment history will appear here once you make your first transaction.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((txn) => (
            <Card key={txn.id} className="glass border-border/50 hover:bg-muted/30 transition-colors">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  {/* Left: icon + info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${
                      txn.rail === 'UPI' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'
                    }`}>
                      {txn.rail === 'UPI' ? <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" /> : <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {isReceivedTransaction(txn) ? `From ${txn.merchant}` : txn.merchant}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                        <span>{new Date(txn.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{txn.rail}</span>
                        {isReceivedTransaction(txn) && (
                          <Badge variant="secondary" className="text-[10px] h-4">Received</Badge>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs font-mono text-muted-foreground/70 mt-1 truncate">
                        {txn.transaction_ref}
                      </p>
                    </div>
                  </div>

                  {/* Right: amount + status */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                      <span className={`text-base sm:text-lg font-semibold ${
                        isReceivedTransaction(txn) ? 'text-primary' : 'text-foreground'
                      }`}>
                        {isReceivedTransaction(txn) ? '+' : ''}₹{txn.amount.toFixed(2)}
                      </span>
                      {getStatusIcon(txn.status)}
                    </div>
                    {getStatusBadge(txn.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
