import React from 'react';
import { ArrowRight, Shield, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Hero = () => {
  return (
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(230 80% 8%), hsl(260 50% 14%), hsl(220 40% 10%))' }}>
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-15" style={{ background: 'var(--gradient-primary)', filter: 'blur(150px)' }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'var(--gradient-accent)', filter: 'blur(120px)' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-white/70 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Now processing 1M+ transactions
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1] font-[Space_Grotesk]">
            The Future of{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-gold)' }}>
              Digital Payments
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            FluxPay unifies UPI and card payments with intelligent routing, 
            dynamic rewards, and bank-grade security.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-20">
            <Button size="lg" className="gradient-primary text-primary-foreground border-0 glow h-12 px-8 text-base font-semibold">
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/15 text-white bg-white/5 hover:bg-white/10 h-12 px-8 text-base">
              Watch Demo
            </Button>
          </div>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: 'Intelligent Routing', desc: 'Auto-select UPI or card for optimal rewards and fees', color: 'from-amber-400 to-orange-500' },
              { icon: Target, title: 'Dynamic Rewards', desc: 'Personalized cashback with geofence offers and tiers', color: 'from-emerald-400 to-teal-500' },
              { icon: Shield, title: 'Bank-Grade Security', desc: 'PCI-DSS compliant with biometric MFA and fraud detection', color: 'from-blue-400 to-indigo-500' },
            ].map((f) => (
              <div key={f.title} className="group bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-sm rounded-2xl p-7 border border-white/[0.06] transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-105 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
