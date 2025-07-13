
import React from 'react';
import { Star, Trophy, Gift, MapPin, TrendingUp, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const RewardsSection = () => {
  const tierInfo = {
    current: 'Gold',
    points: 2847,
    nextTier: 'Platinum',
    pointsToNext: 1153,
    totalForNext: 4000,
    progress: 71
  };

  const offers = [
    {
      id: 1,
      merchant: 'Starbucks',
      offer: '10% Cashback',
      location: 'Within 500m',
      expiry: '2 hours left',
      type: 'geofence'
    },
    {
      id: 2,
      merchant: 'Amazon',
      offer: '5% Extra Points',
      location: 'Online',
      expiry: '3 days left',
      type: 'online'
    },
    {
      id: 3,
      merchant: 'Uber',
      offer: '15% Off Rides',
      location: 'Gold Tier Exclusive',
      expiry: '1 week left',
      type: 'tier'
    }
  ];

  const badges = [
    { name: 'Coffee Lover', icon: '☕', unlocked: true, description: 'Made 25+ coffee purchases' },
    { name: 'Savings Pro', icon: '💰', unlocked: true, description: 'Saved ₹1000+ through rewards' },
    { name: 'Eco Warrior', icon: '🌱', unlocked: false, description: 'Use UPI 50 times this month' },
    { name: 'Night Owl', icon: '🦉', unlocked: false, description: 'Make 10 late night purchases' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rewards & Tier Status</h1>
        <p className="text-gray-600">Track your progress and unlock exclusive benefits</p>
      </div>

      {/* Tier Progress */}
      <Card className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6" />
              <CardTitle>Gold Tier Member</CardTitle>
            </div>
            <Badge className="bg-white/20 text-white border-0">
              {tierInfo.points} points
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {tierInfo.nextTier}</span>
                <span>{tierInfo.pointsToNext} points to go</span>
              </div>
              <Progress value={tierInfo.progress} className="h-3 bg-white/20" />
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-0">
              View Tier Benefits
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Active Offers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="w-5 h-5 mr-2 text-purple-600" />
              Active Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{offer.merchant}</p>
                      <p className="text-lg font-bold text-green-600">{offer.offer}</p>
                    </div>
                    <Badge variant={offer.type === 'geofence' ? 'default' : 'secondary'}>
                      {offer.type === 'geofence' ? 'Nearby' :
                       offer.type === 'tier' ? 'Exclusive' : 'Online'}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {offer.location}
                    </span>
                    <span>{offer.expiry}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Badges & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
              Badges & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <p className={`font-medium mb-1 ${
                    badge.unlocked ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {badge.name}
                  </p>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                  {badge.unlocked && (
                    <Badge className="mt-2 bg-yellow-500 text-white text-xs">Unlocked</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Points Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Points Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">2,847</p>
              <p className="text-sm text-gray-500">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">+247</p>
              <p className="text-sm text-gray-500">This Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">₹285</p>
              <p className="text-sm text-gray-500">Total Savings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">12</p>
              <p className="text-sm text-gray-500">Offers Used</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
