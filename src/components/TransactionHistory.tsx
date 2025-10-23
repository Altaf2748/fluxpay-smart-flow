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

export const TransactionHistory = () => {
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
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', txn.user_id)
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
        <p className="text-gray-600">Your recent payment activity</p>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-500 text-center">
              Your payment history will appear here once you make your first transaction.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((txn) => (
            <Card key={txn.id}>
              <CardContent className="p-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  {/* Left column: icon + texts */}
                  <div className="flex items-start space-x-4 min-w-0">
                    <div
                      className={`p-2 rounded-lg mt-1 ${
                        txn.rail === 'UPI' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      {txn.rail === 'UPI' ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Merchant / title */}
                      <h3 className="font-semibold text-gray-900 truncate">
                        {isReceivedTransaction(txn) ? `From ${txn.merchant}` : txn.merchant}
                      </h3>

                      {/* Three separate lines:
                          1) date
                          2) payment mode (rail) and Received badge (if applicable)
                          3) transaction id (single-line, smaller font to fit)
                      */}
                      <div className="mt-1 text-sm text-gray-500 space-y-1">
                        {/* Line 1: date */}
                        <div className="truncate">
                          {new Date(txn.created_at).toLocaleString()}
                        </div>

                        {/* Line 2: payment mode and Received badge */}
                        <div className="flex items-center space-x-2">
                          <span className="truncate">{txn.rail}</span>
                          {isReceivedTransaction(txn) && (
                            <Badge variant="secondary" className="text-xs">
                              Received
                            </Badge>
                          )}
                        </div>

                        {/* Line 3: transaction id - keep on one line, smaller font
                            - whitespace-nowrap + overflow-hidden ensures single line
                            - increase max-w on larger screens so ID fits better
                        */}
                        <div
                          className="text-xs font-mono text-gray-600 whitespace-nowrap overflow-hidden"
                          style={{ maxWidth: '20rem' }}
                        >
                          {/* Option A: reduce font and allow whole ID to show on most screens.
                              If you still want the whole ID guaranteed visible, consider
                              using overflowX: 'auto' here so users can scroll to see it.
                          */}
                          {txn.transaction_ref}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column: amount + status - don't shrink */}
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`text-lg font-semibold ${
                          isReceivedTransaction(txn) ? 'text-green-600' : 'text-gray-900'
                        }`}
                      >
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
