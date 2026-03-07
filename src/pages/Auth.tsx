import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/');
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { first_name: firstName, last_name: lastName, phone }
        }
      });
      if (error) {
        toast({ title: error.message.includes('already registered') ? "Account exists" : "Sign up failed", description: error.message.includes('already registered') ? "This email is already registered. Please sign in instead." : error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We've sent you a confirmation link to complete your registration." });
      }
    } catch { toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Invalid credentials", description: "Please check your email and password.", variant: "destructive" });
      } else { navigate('/'); }
    } catch { toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(230 80% 8%), hsl(260 50% 12%), hsl(220 40% 10%))' }}>
      {/* Decorative elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: 'var(--gradient-primary)', filter: 'blur(120px)' }} />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-15" style={{ background: 'var(--gradient-accent)', filter: 'blur(100px)' }} />

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border/30 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center glow shadow-lg">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text font-[Space_Grotesk]">FluxPay</span>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Welcome back' : 'Create account'}
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {isLogin ? 'Sign in to your FluxPay account' : 'Join the future of digital payments'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
                    <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required={!isLogin} placeholder="John" className="bg-muted/50 border-border/50" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
                    <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required={!isLogin} placeholder="Doe" className="bg-muted/50 border-border/50" />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-muted-foreground mb-1.5">Phone Number</label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="bg-muted/50 border-border/50" />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john@example.com" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="bg-muted/50 border-border/50 pr-10" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-auto p-1.5 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0 glow h-11 font-semibold" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <Button variant="link" className="p-0 ml-1 h-auto text-primary font-semibold" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
