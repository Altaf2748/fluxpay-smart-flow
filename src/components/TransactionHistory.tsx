
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
      setTransactions(data || []);
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

    // Set up real-time subscription
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
    <div className="max-w-4xl mx-auto p-6">
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      txn.rail === 'UPI' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {txn.rail === 'UPI' ? 
                        <Smartphone className="w-5 h-5" /> : 
                        <CreditCard className="w-5 h-5" />
                      }
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {isReceivedTransaction(txn) ? `From ${txn.merchant}` : txn.merchant}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{new Date(txn.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{txn.rail}</span>
                        {isReceivedTransaction(txn) && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">Received</Badge>
                          </>
                        )}
                        <span>•</span>
                        <span>{txn.transaction_ref}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-lg font-semibold ${
                        isReceivedTransaction(txn) ? 'text-green-600' : 'text-gray-900'
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
