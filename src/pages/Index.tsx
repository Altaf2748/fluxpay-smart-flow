
import React, { useState } from 'react';
import { Hero } from '@/components/Hero';
import { WalletDashboard } from '@/components/WalletDashboard';
import { PaymentFlow } from '@/components/PaymentFlow';
import { RewardsSection } from '@/components/RewardsSection';
import { FeaturesOverview } from '@/components/FeaturesOverview';
import { Settings } from '@/components/Settings';
import { TransactionHistory } from '@/components/TransactionHistory';
import { Analytics } from '@/components/Analytics';
import { Offers } from '@/components/Offers';
import { P2PPayment } from '@/components/P2PPayment';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/components/AuthProvider';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'home' && (
        <>
          <Hero />
          <FeaturesOverview />
        </>
      )}
      
      {activeTab === 'dashboard' && (
        <WalletDashboard 
          onNavigateToPayment={() => setActiveTab('pay')}
          onNavigateToSettings={() => setActiveTab('settings')}
          onNavigateToAnalytics={() => setActiveTab('analytics')}
          onNavigateToOffers={() => setActiveTab('offers')}
        />
      )}
      {activeTab === 'pay' && <PaymentFlow />}
      {activeTab === 'p2p' && <P2PPayment />}
      {activeTab === 'history' && <TransactionHistory />}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'rewards' && <RewardsSection />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'offers' && <Offers />}
    </div>
  );
};

export default Index;
