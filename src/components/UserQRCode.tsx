import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, QrCode as QrCodeIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const UserQRCode = () => {
  const [userPhone, setUserPhone] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setUserPhone(profile.phone || '');
        setUserName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'FluxPay User');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('user-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `fluxpay-qr-${userPhone}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been saved to your device",
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My FluxPay QR Code',
          text: `Send money to ${userName} using this QR code`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      toast({
        title: "Share not supported",
        description: "Your browser doesn't support sharing",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userPhone) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please update your phone number in settings to generate a QR code</p>
        </CardContent>
      </Card>
    );
  }

  const qrData = JSON.stringify({
    type: 'fluxpay',
    phone: userPhone,
    name: userName
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <QrCodeIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">My QR Code</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Share this code to receive payments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment QR Code</CardTitle>
          <CardDescription>
            Others can scan this code to send you money instantly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <QRCodeSVG
                id="user-qr-code"
                value={qrData}
                size={240}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="font-semibold text-lg">{userName}</p>
              <p className="text-sm text-muted-foreground">{userPhone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={downloadQRCode} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={shareQRCode} variant="outline" className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Show this QR code to anyone who wants to send you money. They can scan it from the Send Money page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
