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
  MessageSquare,
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
    { id: 'p2p', label: 'Send', icon: Users },
    { id: 'history', label: 'History', icon: History },
    { id: 'rewards', label: 'Rewards', icon: Star },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'offers', label: 'Offers', icon: Gift },
    { id: 'chat', label: 'Assistant', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex-shrink-0 font-bold text-lg sm:text-xl text-primary">
            FluxPay
          </div>

          {/* Nav Items - Horizontal Scroll on Mobile */}
          <div className="flex-1 mx-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 sm:gap-2 min-w-max">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'flex flex-col sm:flex-row items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0',
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Badge */}
          {user && (
            <div className="flex-shrink-0 text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {userName}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
