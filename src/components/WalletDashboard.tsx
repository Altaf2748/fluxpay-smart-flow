
import React from 'react';
import { CreditCard, Smartphone, TrendingUp, Star, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export const WalletDashboard = () => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  
  const recentTransactions = [
    { id: 1, merchant: 'Starbucks Coffee', amount: -285, type: 'UPI', reward: 14, time: '2 min ago' },
    { id: 2, merchant: 'Amazon Purchase', amount: -1250, type: 'Card', reward: 62, time: '1 hour ago' },
    { id: 3, merchant: 'Salary Credit', amount: 45000, type: 'Bank', reward: 0, time: '2 days ago' },
    { id: 4, merchant: 'Uber Ride', amount: -180, type: 'UPI', reward: 9, time: '1 day ago' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Priya!</h1>
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
                    {balanceVisible ? '₹12,847' : '₹***,***'}
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
                  <p className="font-semibold">₹8,420</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Card Limit</p>
                  <p className="font-semibold">₹4,427 left</p>
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
        <Button className="h-16 bg-blue-600 hover:bg-blue-700 flex-col space-y-1">
          <Zap className="w-5 h-5" />
          <span className="text-sm">Quick Pay</span>
        </Button>
        <Button variant="outline" className="h-16 flex-col space-y-1">
          <CreditCard className="w-5 h-5" />
          <span className="text-sm">Add Card</span>
        </Button>
        <Button variant="outline" className="h-16 flex-col space-y-1">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm">Analytics</span>
        </Button>
        <Button variant="outline" className="h-16 flex-col space-y-1">
          <Star className="w-5 h-5" />
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
