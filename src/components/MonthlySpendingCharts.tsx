import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, ArrowLeft, BarChart3, LineChartIcon, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';

interface MonthlyData {
  month: string;
  label: string;
  spent: number;
  originalTotal: number;
  discountSaved: number;
  cashbackEarned: number;
  totalSavings: number;
  txnCount: number;
}

interface MonthlySpendingChartsProps {
  onBack: () => void;
}

export const MonthlySpendingCharts: React.FC<MonthlySpendingChartsProps> = ({ onBack }) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'bar' | 'line' | 'area'>('area');
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, original_amount, discount_amount, reward_amount, status, transaction_type, created_at')
        .eq('user_id', user.id)
        .eq('status', 'success')
        .neq('transaction_type', 'p2p')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const grouped: Record<string, MonthlyData> = {};
      (data || []).forEach((txn) => {
        const date = new Date(txn.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        if (!grouped[key]) {
          grouped[key] = { month: key, label, spent: 0, originalTotal: 0, discountSaved: 0, cashbackEarned: 0, totalSavings: 0, txnCount: 0 };
        }

        const g = grouped[key];
        g.spent += txn.amount;
        g.originalTotal += txn.original_amount || txn.amount;
        g.discountSaved += txn.discount_amount || 0;
        g.cashbackEarned += txn.reward_amount || 0;
        g.totalSavings = g.discountSaved + g.cashbackEarned;
        g.txnCount += 1;
      });

      const sorted = Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
      setMonthlyData(sorted);
    } catch (err) {
      console.error('Error fetching monthly data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const spent = monthlyData.reduce((s, m) => s + m.spent, 0);
    const saved = monthlyData.reduce((s, m) => s + m.totalSavings, 0);
    const orders = monthlyData.reduce((s, m) => s + m.txnCount, 0);
    const avgMonthly = monthlyData.length ? spent / monthlyData.length : 0;
    return { spent, saved, orders, avgMonthly };
  }, [monthlyData]);

  const chartButtons = [
    { key: 'area' as const, icon: Layers, label: 'Area' },
    { key: 'bar' as const, icon: BarChart3, label: 'Bar' },
    { key: 'line' as const, icon: LineChartIcon, label: 'Line' },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Monthly Insights</h1>
            <p className="text-muted-foreground text-sm">Track spending trends & savings over time</p>
          </div>
        </div>
        <div className="flex gap-1 bg-muted/60 p-1 rounded-lg">
          {chartButtons.map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant={chartView === key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartView(key)}
              className="gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Spent</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">₹{totals.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{totals.orders} orders</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Total Saved</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">₹{totals.saved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground mt-0.5">discounts + cashback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Avg Monthly</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">₹{totals.avgMonthly.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{monthlyData.length} months</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Savings Rate</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              {totals.spent > 0 ? ((totals.saved / (totals.spent + totals.saved)) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">of original prices</p>
          </CardContent>
        </Card>
      </div>

      {monthlyData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mb-3" />
            <p>No spending data yet. Make some payments to see trends!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Spending Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spending Over Time</CardTitle>
              <CardDescription>Monthly amount spent vs original prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={300}>
                  {chartView === 'area' ? (
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="origGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="originalTotal" name="Original Price" stroke="hsl(var(--muted-foreground))" fill="url(#origGrad)" strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="spent" name="Amount Paid" stroke="hsl(var(--primary))" fill="url(#spentGrad)" strokeWidth={2} />
                    </AreaChart>
                  ) : chartView === 'bar' ? (
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="originalTotal" name="Original Price" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="spent" name="Amount Paid" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="originalTotal" name="Original Price" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="spent" name="Amount Paid" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Savings Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Savings Over Time</CardTitle>
              <CardDescription>Discounts & cashback earned each month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="discountSaved" name="Discounts" fill="#22c55e" stackId="savings" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="cashbackEarned" name="Cashback" fill="#f59e0b" stackId="savings" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-3 font-medium">Month</th>
                      <th className="text-right py-2 px-3 font-medium">Orders</th>
                      <th className="text-right py-2 px-3 font-medium">Original</th>
                      <th className="text-right py-2 px-3 font-medium">Paid</th>
                      <th className="text-right py-2 px-3 font-medium">Saved</th>
                      <th className="text-right py-2 px-3 font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((m) => (
                      <tr key={m.month} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{m.label}</td>
                        <td className="text-right py-2.5 px-3">{m.txnCount}</td>
                        <td className="text-right py-2.5 px-3 text-muted-foreground">₹{m.originalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="text-right py-2.5 px-3 font-semibold">₹{m.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="text-right py-2.5 px-3 text-green-600 font-medium">₹{m.totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="text-right py-2.5 px-3 text-primary font-medium">
                          {m.originalTotal > 0 ? ((m.totalSavings / m.originalTotal) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
