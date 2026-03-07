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
  MessageSquare,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation = ({ activeTab, setActiveTab }: NavigationProps) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center glow">
              <Zap className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text font-[Space_Grotesk]">
              FluxPay
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex flex-1 mx-6 items-center justify-center">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      activeTab === item.id
                        ? 'gradient-primary text-primary-foreground shadow-md glow'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile horizontal scroll */}
          <div className="flex lg:hidden flex-1 mx-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 min-w-max">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0',
                      activeTab === item.id
                        ? 'gradient-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Badge */}
          {user && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-semibold gradient-accent text-primary-foreground px-3 py-1.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}
              <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg">
                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-foreground">{userName}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
