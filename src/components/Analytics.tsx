import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, CreditCard, Smartphone, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const Analytics = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async (month: string) => {
    try {
      setLoading(true);
      const { data: response, error } = await supabase.functions.invoke('get-transaction-summary', {
        body: JSON.stringify({ month })
      });

      if (error) throw error;

      setData(response.summary || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (month: string) => {
    try {
      setLoadingTransactions(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = `${month}-01`;
      const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedMonth);
    fetchTransactions(selectedMonth);
  }, [selectedMonth]);

  const totalSpent = data.reduce((sum, item) => sum + item.total, 0);
  const upiTotal = data.reduce((sum, item) => sum + item.upi, 0);
  const cardTotal = data.reduce((sum, item) => sum + item.card, 0);
  const p2pTotal = data.reduce((sum, item) => sum + item.upi_p2p, 0);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track your spending patterns</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
            className="flex-1 sm:flex-none"
          >
            Line
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
            className="flex-1 sm:flex-none"
          >
            Bar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UPI Payments</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{upiTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((upiTotal / totalSpent) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Card Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{cardTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((cardTotal / totalSpent) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">P2P Transfers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">₹{p2pTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((p2pTotal / totalSpent) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
          <CardDescription>
            Daily spending breakdown by payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-60 sm:h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-60 sm:h-80 flex items-center justify-center text-muted-foreground text-sm">
              No transaction data for this month
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={320}>
                {chartType === 'line' ? (
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="upi" stroke="#8884d8" name="UPI" />
                    <Line type="monotone" dataKey="card" stroke="#82ca9d" name="Card" />
                    <Line type="monotone" dataKey="upi_p2p" stroke="#ffc658" name="P2P" />
                  </LineChart>
                ) : (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="upi" fill="#8884d8" name="UPI" />
                    <Bar dataKey="card" fill="#82ca9d" name="Card" />
                    <Bar dataKey="upi_p2p" fill="#ffc658" name="P2P" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            All transactions for the selected month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              No transactions found for this month
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[120px]">Merchant</TableHead>
                    <TableHead className="min-w-[80px]">Type</TableHead>
                    <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                    <TableHead className="text-right min-w-[80px]">Reward</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-xs sm:text-sm">
                        {new Date(txn.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm font-medium">
                        {txn.merchant}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          txn.rail === 'UPI' ? 'bg-blue-100 text-blue-700' :
                          txn.rail === 'CARD' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {txn.rail}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-semibold">
                        ₹{txn.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-yellow-600">
                        {txn.reward_amount > 0 ? `+₹${txn.reward_amount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          txn.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {txn.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};