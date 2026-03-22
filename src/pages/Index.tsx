import React, { useState, useEffect, useRef } from 'react';
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
import { MonthlySpendingCharts } from '@/components/MonthlySpendingCharts';
import { Offers } from '@/components/Offers';
import { BrandStore } from '@/components/BrandStore';
import { P2PPayment } from '@/components/P2PPayment';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/components/AuthProvider';
import { FinanceChatbot } from '@/components/FinanceChatbot';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isEKYCEnrolled } from '@/lib/ekycStorage';
import { useNavigate, useLocation } from 'react-router-dom';

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

type VerificationReturn = {
  returnTab: string;
  pendingPayment: any;
  verifiedResult: 'ACCEPT' | 'REJECT';
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [storeOffer, setStoreOffer] = useState<any>(null);
  const [ekycStatus, setEkycStatus] = useState<boolean | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Verification return payload — stored in STATE (not a ref) so that when
  // onVerificationConsumed clears it, Index re-renders and passes null to the
  // child, preventing any future remount from re-triggering the payment.
  const [verificationReturn, setVerificationReturn] = useState<VerificationReturn | null>(null);

  React.useEffect(() => {
    if (user?.id) {
      isEKYCEnrolled(user.id).then(setEkycStatus);
    }
  }, [user?.id]);

  // On mount: check if we're returning from /ekyc/verify with a verified payment
  useEffect(() => {
    const state = location.state as any;
    if (state?.verifiedResult === 'ACCEPT' && state?.returnTab) {
      // Store in state so clearing it triggers a re-render → child receives null
      setVerificationReturn({
        returnTab: state.returnTab,
        pendingPayment: state.pendingPayment,
        verifiedResult: 'ACCEPT',
      });

      // Switch to the correct tab immediately so the component mounts
      setActiveTab(state.returnTab);

      // Clear the location state so back-navigation doesn't re-trigger
      navigate('/', { replace: true, state: {} });
    } else {
      // Normal tab restoration from sessionStorage (for brand store checkout etc.)
      const targetTab = sessionStorage.getItem('targetTab');
      if (targetTab) {
        setActiveTab(targetTab);
        sessionStorage.removeItem('targetTab');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called by the payment component the moment it has consumed the payload.
  // Clears the state so any future remount of the payment tab receives null.
  const handleVerificationConsumed = React.useCallback(() => {
    setVerificationReturn(null);
  }, []);

  const handleOpenStore = (offer: any) => {
    setStoreOffer(offer);
    setActiveTab('store');
  };

  const handleStoreCheckout = (merchant: string, amount: number, couponCode: string) => {
    sessionStorage.setItem('cartCheckout', JSON.stringify({ merchant, amount, couponCode }));
    setActiveTab('pay');
  };

  const payVerification = verificationReturn?.returnTab === 'pay' ? verificationReturn : null;
  const p2pVerification = verificationReturn?.returnTab === 'p2p' ? verificationReturn : null;

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
            <div className="max-w-md mx-auto px-4 sm:px-6 mb-2 mt-4">
              <Card className="border-border/50 bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ekycStatus === null ? (
                      <div className="h-5 w-48 bg-muted animate-pulse rounded"></div>
                    ) : ekycStatus ? (
                      <><CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-green-600 tracking-tight">Identity Verified (e-KYC)</span></>
                    ) : (
                      <><AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-yellow-600 tracking-tight">Identity not verified</span></>
                    )}
                  </div>
                  {ekycStatus === true && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/ekyc/verify')}>
                      Re-verify
                    </Button>
                  )}
                  {ekycStatus === false && (
                    <Button variant="default" size="sm" onClick={() => navigate('/biometric-setup')}>
                      Set Up Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
            <WalletDashboard 
              onNavigateToPayment={() => setActiveTab('pay')}
              onNavigateToSettings={() => setActiveTab('settings')}
              onNavigateToAnalytics={() => setActiveTab('analytics')}
              onNavigateToOffers={() => setActiveTab('offers')}
            />
          </TabContent>
        )}
        {activeTab === 'pay' && (
          <TabContent key="pay">
            <PaymentFlow
              verificationReturn={payVerification}
              onVerificationConsumed={handleVerificationConsumed}
            />
          </TabContent>
        )}
        {activeTab === 'p2p' && (
          <TabContent key="p2p">
            <P2PPayment
              verificationReturn={p2pVerification}
              onVerificationConsumed={handleVerificationConsumed}
            />
          </TabContent>
        )}
        {activeTab === 'history' && <TabContent key="history"><TransactionHistory onViewReceipts={() => setActiveTab('receipts')} /></TabContent>}
        {activeTab === 'receipts' && <TabContent key="receipts"><Receipts onBack={() => setActiveTab('history')} /></TabContent>}
        {activeTab === 'settings' && <TabContent key="settings"><Settings /></TabContent>}
        {activeTab === 'rewards' && <TabContent key="rewards"><RewardsSection /></TabContent>}
        {activeTab === 'analytics' && <TabContent key="analytics"><Analytics onViewMonthlyInsights={() => setActiveTab('monthly-insights')} onViewReceipts={() => setActiveTab('receipts')} /></TabContent>}
        {activeTab === 'monthly-insights' && <TabContent key="monthly-insights"><MonthlySpendingCharts onBack={() => setActiveTab('analytics')} /></TabContent>}
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
