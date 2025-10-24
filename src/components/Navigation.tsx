import React, { useEffect, useRef, useState } from 'react';
import {
  CreditCard,
  Home,
  Gift,
  Zap,
  Settings,
  History,
  Users,
  BarChart3,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation = ({ activeTab, setActiveTab }: NavigationProps) => {
  const { user } = useAuth();
  const [userName, setUserName] = useState('User');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

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

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center h-12">
          {/* LEFT: Logo */}
          

          {/* CENTER: Nav (scrolls horizontally on small screens) */}
          <div className="flex-1 flex justify-center px-2">
            <div
              className="w-full max-w-[56rem] flex items-center rounded-lg bg-gray-100 p-1 overflow-x-auto no-scrollbar"
              role="tablist"
              aria-label="Main navigation"
            >
              <div className="flex items-center gap-1 px-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      role="tab"
                      aria-selected={activeTab === item.id}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1 rounded-md text-xs sm:text-sm font-medium transition duration-150 flex-shrink-0 whitespace-nowrap',
                        activeTab === item.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: User avatar + menu (no Sign out here anymore) */}
          <div className="flex items-center gap-3 flex-shrink-0 relative" ref={menuRef}>
            {user ? (
              <>
                

                {/* dropdown: removed sign out; added Settings link */}
                
              </>
            ) : (
              <div className="text-sm text-gray-700">Guest</div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
