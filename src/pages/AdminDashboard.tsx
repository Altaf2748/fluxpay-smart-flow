import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Shield, Users, Gift, Plus, Trash2, Edit, ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);

  // Balance setting
  const [balanceDialog, setBalanceDialog] = useState(false);
  const [balanceUser, setBalanceUser] = useState<any>(null);
  const [newUpiBalance, setNewUpiBalance] = useState('');
  const [newCardBalance, setNewCardBalance] = useState('');

  // Offer form
  const [offerDialog, setOfferDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerForm, setOfferForm] = useState({
    title: '', description: '', mcc: '', reward_percent: '', redeem_code: '', terms: '',
    valid_to: '2099-12-31'
  });

  // Admin management
  const [adminEmail, setAdminEmail] = useState('');
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchOffers();
      fetchAdmins();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const fetchOffers = async () => {
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    setOffers(data || []);
  };

  const fetchAdmins = async () => {
    const { data } = await supabase.from('user_roles').select('*').eq('role', 'admin');
    if (data) {
      const adminDetails = await Promise.all(
        data.map(async (r) => {
          const { data: profile } = await supabase.rpc('get_user_display_name', { target_user_id: r.user_id }).single();
          return { ...r, first_name: profile?.first_name, last_name: profile?.last_name };
        })
      );
      setAdmins(adminDetails);
    }
  };

  const fetchUserTransactions = async (userId: string) => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .or(`user_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);
    setUserTransactions(data || []);
  };

  const handleSetBalance = async () => {
    if (!balanceUser) return;
    const updates: any = {};
    if (newUpiBalance !== '') updates.balance = parseFloat(newUpiBalance);
    if (newCardBalance !== '') updates.card_balance = parseFloat(newCardBalance);

    if (Object.keys(updates).length === 0) {
      toast({ title: 'No values', description: 'Enter at least one balance value.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('profiles').update(updates).eq('user_id', balanceUser.user_id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Balance Updated', description: `Balances set for ${balanceUser.first_name || 'user'}.` });
      setBalanceDialog(false);
      fetchUsers();
    }
  };

  const handleSaveOffer = async () => {
    const payload = {
      title: offerForm.title,
      description: offerForm.description,
      mcc: offerForm.mcc,
      reward_percent: parseFloat(offerForm.reward_percent) || 0,
      redeem_code: offerForm.redeem_code,
      terms: offerForm.terms,
      valid_to: offerForm.valid_to,
      active: true,
    };

    let error;
    if (editingOffer) {
      ({ error } = await supabase.from('offers').update(payload).eq('id', editingOffer.id));
    } else {
      ({ error } = await supabase.from('offers').insert(payload));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingOffer ? 'Offer Updated' : 'Offer Created' });
      setOfferDialog(false);
      setEditingOffer(null);
      resetOfferForm();
      fetchOffers();
    }
  };

  const handleDeleteOffer = async (id: string) => {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Offer Deleted' });
      fetchOffers();
    }
  };

  const handleToggleOffer = async (offer: any) => {
    const { error } = await supabase.from('offers').update({ active: !offer.active }).eq('id', offer.id);
    if (!error) fetchOffers();
  };

  const handleAddAdmin = async () => {
    if (!adminEmail.trim()) return;
    // Look up user by email from profiles — we need to find user_id
    // Since we can't query auth.users, we'll use an edge function approach
    // For now, search profiles by matching — but profiles don't store email
    // We need to use a different approach: the admin enters the user_id or we search
    toast({ title: 'Looking up user...', description: 'Searching for the user.' });

    // We'll search all profiles and match — admin can see all
    const { data: allProfiles } = await supabase.from('profiles').select('user_id, first_name, last_name');
    // We can't get email from profiles. Let's use supabase admin API via edge function
    // For simplicity, let's create an edge function for this
    const { data, error } = await supabase.functions.invoke('admin-lookup-user', {
      body: { email: adminEmail }
    });

    if (error || !data?.user_id) {
      toast({ title: 'User not found', description: 'No user with that email exists.', variant: 'destructive' });
      return;
    }

    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: data.user_id,
      role: 'admin' as any
    });

    if (roleError) {
      toast({ title: 'Error', description: roleError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Admin Added', description: `${adminEmail} is now an admin.` });
      setAdminEmail('');
      fetchAdmins();
    }
  };

  const resetOfferForm = () => {
    setOfferForm({ title: '', description: '', mcc: '', reward_percent: '', redeem_code: '', terms: '', valid_to: '2099-12-31' });
  };

  const openEditOffer = (offer: any) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      description: offer.description || '',
      mcc: offer.mcc,
      reward_percent: String(offer.reward_percent),
      redeem_code: offer.redeem_code || '',
      terms: offer.terms || '',
      valid_to: offer.valid_to ? offer.valid_to.split('T')[0] : '2099-12-31',
    });
    setOfferDialog(true);
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage users, offers, and system settings</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
          </Button>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Users</TabsTrigger>
            <TabsTrigger value="offers"><Gift className="w-4 h-4 mr-1" /> Offers</TabsTrigger>
            <TabsTrigger value="admins"><Shield className="w-4 h-4 mr-1" /> Admins</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>UPI Balance</TableHead>
                      <TableHead>Card Balance</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.first_name || ''} {u.last_name || ''}
                        </TableCell>
                        <TableCell>{u.phone || '—'}</TableCell>
                        <TableCell>
                          {u.balance !== null ? `₹${Number(u.balance).toLocaleString()}` : <Badge variant="destructive">Not Set</Badge>}
                        </TableCell>
                        <TableCell>
                          {u.card_balance !== null ? `₹${Number(u.card_balance).toLocaleString()}` : <Badge variant="destructive">Not Set</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.kyc_status === 'verified' ? 'default' : 'secondary'}>
                            {u.kyc_status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setBalanceUser(u);
                              setNewUpiBalance(u.balance !== null ? String(u.balance) : '');
                              setNewCardBalance(u.card_balance !== null ? String(u.card_balance) : '');
                              setBalanceDialog(true);
                            }}>
                              Set Balance
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setSelectedUser(u);
                              fetchUserTransactions(u.user_id);
                            }}>
                              Transactions
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OFFERS TAB */}
          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Offers ({offers.length})</CardTitle>
                  <Button onClick={() => { resetOfferForm(); setEditingOffer(null); setOfferDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Offer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>MCC</TableHead>
                      <TableHead>Reward %</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.title}</TableCell>
                        <TableCell>{o.mcc}</TableCell>
                        <TableCell>{o.reward_percent}%</TableCell>
                        <TableCell><code className="text-xs">{o.redeem_code}</code></TableCell>
                        <TableCell>
                          <Badge
                            variant={o.active ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => handleToggleOffer(o)}
                          >
                            {o.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openEditOffer(o)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteOffer(o.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADMINS TAB */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Admin Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter user email to make admin"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                  <Button onClick={handleAddAdmin}>
                    <UserPlus className="w-4 h-4 mr-2" /> Add Admin
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.first_name || ''} {a.last_name || ''}</TableCell>
                        <TableCell className="font-mono text-xs">{a.user_id}</TableCell>
                        <TableCell><Badge>admin</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Balance Dialog */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Balance for {balanceUser?.first_name} {balanceUser?.last_name}</DialogTitle>
            <DialogDescription>Set the UPI and Card balance for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>UPI Balance (₹)</Label>
              <Input type="number" value={newUpiBalance} onChange={(e) => setNewUpiBalance(e.target.value)} placeholder="e.g. 10000" />
            </div>
            <div>
              <Label>Card Balance (₹)</Label>
              <Input type="number" value={newCardBalance} onChange={(e) => setNewCardBalance(e.target.value)} placeholder="e.g. 5000" />
            </div>
            <Button onClick={handleSetBalance} className="w-full">Save Balances</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={offerDialog} onOpenChange={setOfferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Edit Offer' : 'Create Offer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} /></div>
            <div><Label>MCC / Category</Label><Input value={offerForm.mcc} onChange={(e) => setOfferForm({ ...offerForm, mcc: e.target.value })} /></div>
            <div><Label>Reward %</Label><Input type="number" value={offerForm.reward_percent} onChange={(e) => setOfferForm({ ...offerForm, reward_percent: e.target.value })} /></div>
            <div><Label>Redeem Code</Label><Input value={offerForm.redeem_code} onChange={(e) => setOfferForm({ ...offerForm, redeem_code: e.target.value })} /></div>
            <div><Label>Terms</Label><Input value={offerForm.terms} onChange={(e) => setOfferForm({ ...offerForm, terms: e.target.value })} /></div>
            <div><Label>Valid Until</Label><Input type="date" value={offerForm.valid_to} onChange={(e) => setOfferForm({ ...offerForm, valid_to: e.target.value })} /></div>
            <Button onClick={handleSaveOffer} className="w-full">{editingOffer ? 'Update' : 'Create'} Offer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Transactions Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transactions for {selectedUser?.first_name} {selectedUser?.last_name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{t.merchant}</TableCell>
                    <TableCell>₹{t.amount}</TableCell>
                    <TableCell><Badge variant="secondary">{t.rail}</Badge></TableCell>
                    <TableCell><Badge variant={t.status === 'success' ? 'default' : 'destructive'}>{t.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {userTransactions.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No transactions found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
