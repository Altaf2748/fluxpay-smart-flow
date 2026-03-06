import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { action, email, user_id } = body;

    // List all users with emails
    if (action === 'list_emails') {
      const { data: { users }, error } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;

      const emailMap: Record<string, string> = {};
      users?.forEach((u: any) => {
        if (u.email) emailMap[u.id] = u.email;
      });

      return new Response(JSON.stringify({ emails: emailMap }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete user
    if (action === 'delete_user' && user_id) {
      // Prevent self-deletion
      if (user_id === user.id) {
        return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { error: delError } = await serviceClient.auth.admin.deleteUser(user_id);
      if (delError) throw delError;

      // Clean up profile and related data
      await serviceClient.from('profiles').delete().eq('user_id', user_id);
      await serviceClient.from('user_roles').delete().eq('user_id', user_id);
      await serviceClient.from('admin_requests').delete().eq('user_id', user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Original: lookup by email
    if (email) {
      const { data: { users }, error } = await serviceClient.auth.admin.listUsers();
      if (error) throw error;

      const found = users?.find((u: any) => u.email === email);
      if (!found) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ user_id: found.id, email: found.email }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
