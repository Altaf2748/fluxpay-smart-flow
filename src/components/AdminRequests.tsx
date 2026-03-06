import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, ShieldAlert, Send } from 'lucide-react';

export const PasswordResetRequest = () => {
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchExistingRequest();
  }, []);

  const fetchExistingRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('admin_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('request_type', 'password_reset')
      .eq('status', 'pending')
      .maybeSingle();

    setExistingRequest(data);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('admin_requests').insert({
        user_id: user.id,
        request_type: 'password_reset',
        message: message || 'Requesting password reset assistance',
      });

      if (error) throw error;

      toast({ title: 'Request Sent', description: 'Your password reset request has been sent to the admin.' });
      setMessage('');
      fetchExistingRequest();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Request Password Reset
        </CardTitle>
      </CardHeader>
      <CardContent>
        {existingRequest ? (
          <div className="text-center py-4 space-y-2">
            <Badge variant="secondary" className="text-sm">Request Pending</Badge>
            <p className="text-sm text-muted-foreground">Your password reset request is being reviewed by an admin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Can't reset your password? Send a request to the admin for help.
            </p>
            <Textarea
              placeholder="Describe your issue (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Request to Admin'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const EKYCSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('user_id', user.id)
      .single();

    setKycStatus(profile?.kyc_status || 'pending');

    const { data: request } = await supabase
      .from('admin_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('request_type', 'ekyc_verification')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setExistingRequest(request);
  };

  const handleSubmitKYC = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('admin_requests').insert({
        user_id: user.id,
        request_type: 'ekyc_verification',
        message: 'eKYC verification request submitted',
      });

      if (error) throw error;

      toast({ title: 'eKYC Submitted', description: 'Your eKYC verification request has been sent for review.' });
      fetchStatus();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = kycStatus === 'verified' ? 'default' : kycStatus === 'rejected' ? 'destructive' : 'secondary';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          eKYC Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Status</span>
            <Badge variant={statusColor}>{kycStatus || 'pending'}</Badge>
          </div>

          {kycStatus === 'verified' ? (
            <p className="text-sm text-green-600 font-medium">✓ Your identity has been verified.</p>
          ) : existingRequest?.status === 'pending' ? (
            <p className="text-sm text-muted-foreground">Your eKYC request is under review by an admin.</p>
          ) : (
            <Button onClick={handleSubmitKYC} disabled={loading} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Submitting...' : 'Submit eKYC for Verification'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
