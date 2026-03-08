import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hero } from '@/components/Hero';
import { WalletDashboard } from '@/components/WalletDashboard';
import { PaymentFlow } from '@/components/PaymentFlow';
import { RewardsSection } from '@/components/RewardsSection';
import { FeaturesOverview } from '@/components/FeaturesOverview';
import { Settings } from '@/components/Settings';
import { TransactionHistory } from '@/components/TransactionHistory';
import { Receipts } from '@/components/Receipts';
import { Analytics } from '@/components/Analytics';
import { Offers } from '@/components/Offers';
import { BrandStore } from '@/components/BrandStore';
import { P2PPayment } from '@/components/P2PPayment';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/components/AuthProvider';
import { FinanceChatbot } from '@/components/FinanceChatbot';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const TabContent = ({ children }: { children: React.ReactNode }) => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [storeOffer, setStoreOffer] = useState<any>(null);
  const { user } = useAuth();

  React.useEffect(() => {
    const targetTab = sessionStorage.getItem('targetTab');
    if (targetTab) {
      setActiveTab(targetTab);
      sessionStorage.removeItem('targetTab');
    }
  }, []);

  const handleOpenStore = (offer: any) => {
    setStoreOffer(offer);
    setActiveTab('store');
  };

  const handleStoreCheckout = (merchant: string, amount: number, couponCode: string) => {
    sessionStorage.setItem('cartCheckout', JSON.stringify({ merchant, amount, couponCode }));
    setActiveTab('pay');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <TabContent key="home">
            <Hero />
            <FeaturesOverview />
          </TabContent>
        )}
        
        {activeTab === 'dashboard' && (
          <TabContent key="dashboard">
            <WalletDashboard 
              onNavigateToPayment={() => setActiveTab('pay')}
              onNavigateToSettings={() => setActiveTab('settings')}
              onNavigateToAnalytics={() => setActiveTab('analytics')}
              onNavigateToOffers={() => setActiveTab('offers')}
            />
          </TabContent>
        )}
        {activeTab === 'pay' && <TabContent key="pay"><PaymentFlow /></TabContent>}
        {activeTab === 'p2p' && <TabContent key="p2p"><P2PPayment /></TabContent>}
        {activeTab === 'history' && <TabContent key="history"><TransactionHistory /></TabContent>}
        {activeTab === 'settings' && <TabContent key="settings"><Settings /></TabContent>}
        {activeTab === 'rewards' && <TabContent key="rewards"><RewardsSection /></TabContent>}
        {activeTab === 'analytics' && <TabContent key="analytics"><Analytics /></TabContent>}
        {activeTab === 'offers' && <TabContent key="offers"><Offers onOpenStore={handleOpenStore} /></TabContent>}
        {activeTab === 'store' && storeOffer && (
          <TabContent key="store">
            <BrandStore 
              offer={storeOffer} 
              onBack={() => setActiveTab('offers')} 
              onCheckout={handleStoreCheckout} 
            />
          </TabContent>
        )}
        {activeTab === 'chat' && <TabContent key="chat"><FinanceChatbot /></TabContent>}
      </AnimatePresence>
    </div>
  );
};

export default Index;
