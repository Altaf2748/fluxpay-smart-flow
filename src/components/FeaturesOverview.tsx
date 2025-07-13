
import React from 'react';
import { Smartphone, CreditCard, Shield, Zap, Target, MapPin, BarChart3, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const FeaturesOverview = () => {
  const features = [
    {
      icon: Zap,
      title: 'Intelligent Payment Routing',
      description: 'AI-powered system automatically selects UPI or card based on rewards, fees, and risk optimization for maximum savings.',
      color: 'blue'
    },
    {
      icon: Target,
      title: 'Dynamic Rewards Engine',
      description: 'Personalized cashback with geofence-based offers, gamified tiers, and exclusive merchant partnerships.',
      color: 'green'
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: 'PCI-DSS compliant with tokenization, biometric MFA, and real-time fraud detection using machine learning.',
      color: 'purple'
    },
    {
      icon: Wifi,
      title: 'Offline Payment Support',
      description: 'NFC-based EMV tokens for cards and static QR codes for UPI when internet connectivity is limited.',
      color: 'orange'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Financial Insights',
      description: 'Smart transaction categorization, spending dashboards, budget tracking, and personalized goal setting.',
      color: 'indigo'
    },
    {
      icon: MapPin,
      title: 'Location-Based Offers',
      description: 'Proximity-triggered deals from nearby merchants with geofencing technology for maximum relevance.',
      color: 'pink'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50 border-blue-200',
      green: 'from-green-500 to-green-600 text-green-600 bg-green-50 border-green-200',
      purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50 border-purple-200',
      orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50 border-orange-200',
      indigo: 'from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50 border-indigo-200',
      pink: 'from-pink-500 to-pink-600 text-pink-600 bg-pink-50 border-pink-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Payments
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            FluxPay combines cutting-edge technology with user-friendly design to deliver 
            the most advanced digital payment experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClasses = getColorClasses(feature.color);
            const [gradientClass, textClass, bgClass, borderClass] = colorClasses.split(' ');
            
            return (
              <Card key={index} className={`${bgClass} ${borderClass} hover:shadow-lg transition-all duration-300`}>
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-r ${gradientClass} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className={`${textClass} text-xl`}>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Built on Modern Architecture</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Frontend</h4>
              <p className="text-sm text-gray-600">React Native, SwiftUI, Kotlin Jetpack</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Backend</h4>
              <p className="text-sm text-gray-600">Kubernetes, Kafka, Microservices</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Database</h4>
              <p className="text-sm text-gray-600">PostgreSQL, MongoDB, Redis</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Security</h4>
              <p className="text-sm text-gray-600">HSM, PCI-DSS, Tokenization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
