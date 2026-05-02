// Cloudflare Pages Function: POST /api/settle
// Admin-only endpoint that settles an issue and triggers RPC to backfill judgments.
// Reference: GDD §6.3 + plan M4.3

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface SettleBody {
  issueId: string;
  result: 'correct' | 'wrong' | 'cancelled';
  source: string;
  note?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 1. Require Authorization header (caller's JWT)
  const auth = request.headers.get('Authorization');
  if (!auth) return json({ error: 'unauthorized' }, 401);

  const token = auth.replace(/^Bearer\s+/i, '');

  // 2. Verify the JWT and resolve user ID via Auth API
  const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: 'invalid token' }, 401);
  const callerId = userData.user.id;

  // 3. Service-role client for RLS bypass
  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 4. Verify caller is admin
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', callerId)
    .single();
  if (!profile?.is_admin) return json({ error: 'forbidden' }, 403);

  // 5. Parse body
  let body: SettleBody;
  try {
    body = (await request.json()) as SettleBody;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  if (!body.issueId || !body.result || !body.source) {
    return json({ error: 'missing fields' }, 400);
  }
  if (!['correct', 'wrong', 'cancelled'].includes(body.result)) {
    return json({ error: 'invalid result' }, 400);
  }

  // 6. Update issue row
  const updateRow: Record<string, unknown> = {
    status: body.result,
    settled_at: new Date().toISOString(),
    settled_by: callerId,
    settlement_source: body.source,
    settlement_note: body.note ?? null,
  };
  const { error: upErr } = await admin.from('issues').update(updateRow).eq('id', body.issueId);
  if (upErr) return json({ error: upErr.message }, 500);

  // 7. If not cancelled, backfill judgments + posts via RPC
  if (body.result !== 'cancelled') {
    const settlementBool = body.result === 'correct'; // true = 支持方对
    const { error: rpcErr } = await admin.rpc('settle_judgments', {
      p_issue_id: body.issueId,
      p_result: settlementBool,
    });
    if (rpcErr) return json({ error: rpcErr.message }, 500);
  }

  return json({ ok: true });
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
