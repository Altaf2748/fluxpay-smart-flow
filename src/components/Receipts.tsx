import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Receipt,
  ArrowLeft,
  Smartphone,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
  ShoppingBag,
  Wallet,
  Tag,
  Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  original_amount: number | null;
  discount_amount: number | null;
  coupon_code: string | null;
  rail: string;
  status: string;
  transaction_ref: string;
  created_at: string;
  reward_amount: number | null;
  transaction_type: string | null;
  recipient_id: string | null;
}

interface ReceiptsProps {
  onBack: () => void;
}

export const Receipts: React.FC<ReceiptsProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, merchant, amount, original_amount, discount_amount, coupon_code, rail, status, transaction_ref, created_at, reward_amount, transaction_type, recipient_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data as Transaction[]) || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only payment transactions (not p2p)
  const paymentTxns = transactions.filter(t => t.transaction_type !== 'p2p');
  const successfulTxns = paymentTxns.filter(t => t.status === 'success');

  // Summary stats
  const totalSpent = successfulTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalOriginal = successfulTxns.reduce((sum, t) => sum + (t.original_amount || t.amount), 0);
  const totalSaved = successfulTxns.reduce((sum, t) => sum + (t.discount_amount || 0), 0);
  const totalCashback = successfulTxns.reduce((sum, t) => sum + (t.reward_amount || 0), 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const downloadInvoicePDF = (txn: Transaction) => {
    const orig = txn.original_amount || txn.amount;
    const disc = txn.discount_amount || 0;
    const cashback = txn.reward_amount || 0;
    const date = formatDate(txn.created_at);

    // Build a clean HTML invoice
    const html = `
      <html>
      <head>
        <title>Invoice - ${txn.transaction_ref}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #6c63ff; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 800; color: #6c63ff; letter-spacing: -0.5px; }
          .logo span { color: #1a1a2e; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { font-size: 22px; color: #6c63ff; margin-bottom: 4px; }
          .invoice-title p { font-size: 12px; color: #666; }
          .details { display: flex; justify-content: space-between; margin-bottom: 28px; }
          .details-col p { font-size: 13px; color: #444; line-height: 1.8; }
          .details-col strong { color: #1a1a2e; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f0efff; color: #6c63ff; text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #eee; }
          .amount { text-align: right; font-weight: 600; }
          .discount { color: #22c55e; }
          .total-row td { border-top: 2px solid #6c63ff; font-weight: 700; font-size: 16px; background: #f8f7ff; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 11px; }
          .savings-banner { background: linear-gradient(135deg, #dcfce7, #d1fae5); border: 1px solid #86efac; border-radius: 8px; padding: 12px 20px; text-align: center; margin-bottom: 24px; color: #166534; font-weight: 600; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .badge-success { background: #dcfce7; color: #166534; }
          .badge-failed { background: #fee2e2; color: #991b1b; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Flux<span>Pay</span></div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p>${txn.transaction_ref}</p>
          </div>
        </div>
        <div class="details">
          <div class="details-col">
            <p><strong>Merchant:</strong> ${txn.merchant}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Payment Method:</strong> ${txn.rail}</p>
          </div>
          <div class="details-col" style="text-align:right;">
            <p><strong>Status:</strong> <span class="badge ${txn.status === 'success' ? 'badge-success' : 'badge-failed'}">${txn.status.toUpperCase()}</span></p>
            ${txn.coupon_code ? `<p><strong>Coupon:</strong> ${txn.coupon_code}</p>` : ''}
          </div>
        </div>
        ${disc > 0 ? `<div class="savings-banner">🎉 You saved ₹${(disc + cashback).toFixed(2)} on this order!</div>` : ''}
        <table>
          <thead>
            <tr><th>Description</th><th class="amount">Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Original Price</td><td class="amount">₹${orig.toFixed(2)}</td></tr>
            ${disc > 0 ? `<tr><td>Discount${txn.coupon_code ? ` (${txn.coupon_code})` : ''}</td><td class="amount discount">-₹${disc.toFixed(2)}</td></tr>` : ''}
            <tr class="total-row"><td>Amount Paid</td><td class="amount">₹${txn.amount.toFixed(2)}</td></tr>
            ${cashback > 0 ? `<tr><td>Cashback Earned</td><td class="amount" style="color:#d97706">+₹${cashback.toFixed(2)}</td></tr>` : ''}
          </tbody>
        </table>
        <div class="footer">
          <p>Thank you for using FluxPay • This is a computer-generated invoice</p>
          <p style="margin-top:4px;">Transaction Ref: ${txn.transaction_ref} • Generated on ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Payment Receipts</h1>
          <p className="text-muted-foreground text-sm">Detailed breakdown of your spending & savings</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Orders</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{successfulTxns.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/40 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-foreground" />
              <span className="text-xs text-muted-foreground">Total Spent</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">₹{totalSpent.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Discounts Saved</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">₹{totalSaved.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Cashback Earned</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-600">₹{totalCashback.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Savings bar */}
      {totalOriginal > 0 && totalSaved > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">You saved {((totalSaved / totalOriginal) * 100).toFixed(1)}% on your purchases!</span>
              <span className="text-sm text-green-600 font-bold">₹{(totalSaved + totalCashback).toFixed(0)} total savings</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min((totalSaved / totalOriginal) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Receipts List */}
      {paymentTxns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Receipt className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No payment receipts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paymentTxns.map((txn) => {
            const origAmount = txn.original_amount || txn.amount;
            const discount = txn.discount_amount || 0;
            const hasDiscount = discount > 0;

            return (
              <Card
                key={txn.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedTxn(txn)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        txn.rail === 'UPI' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'
                      }`}>
                        {txn.rail === 'UPI' ? <Smartphone className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">{txn.merchant}</h3>
                          {hasDiscount && (
                            <Badge variant="secondary" className="text-[10px] h-4 shrink-0 bg-green-500/10 text-green-600 border-green-500/20">
                              -{((discount / origAmount) * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{formatDate(txn.created_at)}</span>
                          {txn.coupon_code && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-primary">{txn.coupon_code}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {hasDiscount && (
                        <p className="text-xs text-muted-foreground line-through">₹{origAmount.toFixed(0)}</p>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-semibold">₹{txn.amount.toFixed(2)}</span>
                        {getStatusIcon(txn.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Receipt Detail Dialog */}
      <Dialog open={!!selectedTxn} onOpenChange={() => setSelectedTxn(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Payment Receipt
            </DialogTitle>
            <DialogDescription>
              {selectedTxn && formatDate(selectedTxn.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedTxn && (() => {
            const orig = selectedTxn.original_amount || selectedTxn.amount;
            const disc = selectedTxn.discount_amount || 0;
            const cashback = selectedTxn.reward_amount || 0;

            return (
              <div className="space-y-4">
                {/* Merchant */}
                <div className="text-center">
                  <p className="text-lg font-bold">{selectedTxn.merchant}</p>
                  <Badge variant={selectedTxn.status === 'success' ? 'default' : 'destructive'} className="mt-1">
                    {selectedTxn.status === 'success' ? 'Paid' : selectedTxn.status}
                  </Badge>
                </div>

                <Separator />

                {/* Breakdown */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Amount</span>
                    <span className="font-medium">₹{orig.toFixed(2)}</span>
                  </div>

                  {disc > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Discount
                        {selectedTxn.coupon_code && (
                          <span className="font-mono text-primary text-xs">({selectedTxn.coupon_code})</span>
                        )}
                      </span>
                      <span className="font-medium text-green-600">-₹{disc.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Amount Paid</span>
                    <span className="font-bold">₹{selectedTxn.amount.toFixed(2)}</span>
                  </div>

                  {cashback > 0 && (
                    <div className="flex justify-between bg-amber-500/5 rounded-lg p-2 -mx-1">
                      <span className="text-muted-foreground text-xs">Cashback Earned</span>
                      <span className="font-semibold text-amber-600 text-xs">+₹{cashback.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Meta */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-medium text-foreground">{selectedTxn.rail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction Ref</span>
                    <span className="font-mono text-foreground">{selectedTxn.transaction_ref}</span>
                  </div>
                </div>

                {disc > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                    <p className="text-green-600 font-semibold text-sm">
                      You saved ₹{(disc + cashback).toFixed(2)} on this order!
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Receipts;
