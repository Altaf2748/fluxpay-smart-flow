import React from 'react';
import { Shield, Zap, Target, MapPin, BarChart3, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const FeaturesOverview = () => {
  const features = [
    { icon: Zap, title: 'Intelligent Payment Routing', description: 'AI-powered system selects UPI or card for maximum savings on every transaction.', gradient: 'from-blue-500 to-indigo-600' },
    { icon: Target, title: 'Dynamic Rewards Engine', description: 'Personalized cashback with geofence offers, gamified tiers, and merchant partnerships.', gradient: 'from-emerald-500 to-teal-600' },
    { icon: Shield, title: 'Bank-Grade Security', description: 'PCI-DSS compliant with tokenization, biometric MFA, and real-time fraud detection.', gradient: 'from-violet-500 to-purple-600' },
    { icon: Wifi, title: 'Offline Payment Support', description: 'NFC-based EMV tokens for cards and static QR codes for UPI when offline.', gradient: 'from-amber-500 to-orange-600' },
    { icon: BarChart3, title: 'Real-Time Financial Insights', description: 'Smart categorization, spending dashboards, budget tracking, and goal setting.', gradient: 'from-rose-500 to-pink-600' },
    { icon: MapPin, title: 'Location-Based Offers', description: 'Proximity-triggered deals from nearby merchants with geofencing technology.', gradient: 'from-cyan-500 to-blue-600' },
  ];

  return (
    <div className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Powerful Features for Modern Payments
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cutting-edge technology meets user-friendly design for the most advanced payment experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <Card key={feature.title} className="glass glass-hover border-border/50 group">
              <CardHeader>
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-foreground text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8 tracking-tight">Built on Modern Architecture</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Frontend', desc: 'React, TypeScript, Tailwind' },
              { title: 'Backend', desc: 'Edge Functions, Microservices' },
              { title: 'Database', desc: 'PostgreSQL, Redis' },
              { title: 'Security', desc: 'HSM, PCI-DSS, Tokenization' },
            ].map((item) => (
              <div key={item.title} className="glass glass-hover rounded-xl p-6">
                <h4 className="font-semibold text-foreground mb-1.5 text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
