
import React from 'react';
import { ArrowRight, Shield, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Hero = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800" />
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The Future of
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {" "}Digital Payments
            </span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            FluxPay unifies UPI and card payments with intelligent routing, 
            dynamic rewards, and robust security for seamless transactions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Watch Demo
            </Button>
          </div>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Zap className="w-12 h-12 text-yellow-400 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">Intelligent Routing</h3>
              <p className="text-blue-100">Auto-select UPI or card based on rewards, fees, and risk optimization</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Target className="w-12 h-12 text-green-400 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">Dynamic Rewards</h3>
              <p className="text-blue-100">Personalized cashback with geofence offers and gamified tiers</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Shield className="w-12 h-12 text-blue-400 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">Bank-Grade Security</h3>
              <p className="text-blue-100">PCI-DSS compliant with biometric MFA and real-time fraud detection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
