
import React, { useState } from 'react';
import { Hero } from '@/components/Hero';
import { WalletDashboard } from '@/components/WalletDashboard';
import { PaymentFlow } from '@/components/PaymentFlow';
import { RewardsSection } from '@/components/RewardsSection';
import { FeaturesOverview } from '@/components/FeaturesOverview';
import { Navigation } from '@/components/Navigation';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'home' && (
        <>
          <Hero />
          <FeaturesOverview />
        </>
      )}
      
      {activeTab === 'dashboard' && <WalletDashboard />}
      {activeTab === 'pay' && <PaymentFlow />}
      {activeTab === 'rewards' && <RewardsSection />}
    </div>
  );
};

export default Index;
