import React, { useEffect, useState } from 'react';
import { CreditCard, Home, Gift, Zap, LogOut, Settings, History, Users, BarChart3, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation = ({ activeTab, setActiveTab }: NavigationProps) => {
  const { signOut, user } = useAuth();
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const fetchUserName = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setUserName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User');
        }
      }
    };
    fetchUserName();
  }, [user]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'pay', label: 'Pay', icon: CreditCard },
    { id: 'p2p', label: 'Send Money', icon: Users },
    { id: 'history', label: 'History', icon: History },
    { id: 'rewards', label: 'Rewards', icon: Star },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'offers', label: 'Offers', icon: Gift },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      {/* Slightly smaller max width than before to reduce extra whitespace */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Reduced height to make navbar feel less tall */}
        <div className="flex items-center h-14">
          {/* Left: logo and (optional) user name */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            
            

            {/* small profile pill, hidden on small screens */}
            {user && (
              <div className="hidden md:flex items-center ml-3 space-x-2 px-2.5 py-1 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 truncate max-w-[9rem]">{userName}</span>
              </div>
            )}
          </div>

          {/* Center: nav (flex-1) - but constrain nav items to a max width to avoid huge spread */}
          <div className="flex-1 flex justify-center px-2">
            {/* max-w constrains nav width (adjust 720px smaller/larger to taste) */}
            <div
              className="w-full max-w-[72rem] md:max-w-[60rem] lg:max-w-[48rem] flex items-center rounded-lg bg-gray-100 p-1 overflow-x-auto"
              role="tablist"
              aria-label="Main navigation"
            >
              <div className="flex items-center space-x-1 px-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      role="tab"
                      aria-selected={activeTab === item.id}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 flex-shrink-0 whitespace-nowrap",
                        activeTab === item.id
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:block">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
