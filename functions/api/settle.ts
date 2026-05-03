// Cloudflare Pages Function: POST /api/settle
// Admin-only endpoint that settles an issue and triggers RPC to backfill judgments.
// Reference: GDD §6.3 + plan M4.3

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
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

  // 8. Send settlement emails to all judging users (fire-and-forget)
  if (env.RESEND_API_KEY && body.result !== 'cancelled') {
    sendSettlementEmails(admin, env, body.issueId, body.result).catch(() => {});
  }

  return json({ ok: true });
}

async function sendSettlementEmails(
  admin: ReturnType<typeof createClient>,
  env: Env,
  issueId: string,
  result: 'correct' | 'wrong'
) {
  // Get issue title
  const { data: issue } = await admin
    .from('issues')
    .select('title')
    .eq('id', issueId)
    .single();
  if (!issue) return;

  // Get all judgments with user emails (auth.users join via service-role)
  const { data: judgments } = await admin
    .from('judgments')
    .select('user_id, stance, is_correct, counts_toward_rank')
    .eq('issue_id', issueId);
  if (!judgments || judgments.length === 0) return;

  // Fetch emails via auth admin API
  const userIds = [...new Set(judgments.map((j) => j.user_id))];
  const emails: { userId: string; email: string }[] = [];
  for (const uid of userIds) {
    const { data } = await admin.auth.admin.getUserById(uid);
    if (data?.user?.email) emails.push({ userId: uid, email: data.user.email });
  }
  if (emails.length === 0) return;

  const from = env.FROM_EMAIL ?? 'noreply@jiziyi.asia';
  const settlementBool = result === 'correct';

  // Build batch emails
  const batch = emails.map(({ userId, email }) => {
    const judgment = judgments.find((j) => j.user_id === userId);
    const isCorrect = judgment ? judgment.stance === settlementBool : false;
    const countsTowardRank = judgment?.counts_toward_rank ?? false;
    const rankNote = countsTowardRank ? '（计入段位）' : '（围观，不计段位）';
    const subject = isCorrect
      ? `✓ 你猜对了！《${issue.title}》`
      : `✕ 这次看走眼了《${issue.title}》`;
    const body = `
<p>你好，</p>
<p>灼见《${issue.title}》议题已结算。</p>
<p><strong>结算结果：${result === 'correct' ? '支持方正确' : '反对方正确'}</strong></p>
<p>你的判断：<strong>${judgment?.stance ? '支持' : '反对'}</strong> ${rankNote}</p>
<p>${isCorrect ? '🎉 恭喜，你预测正确！准确率+1' : '🙁 这次没押中，下次加油'}</p>
<p><a href="https://www.jiziyi.asia">查看段位 →</a></p>
<p style="color:#999;font-size:12px">灼见 · 比世界快一步</p>
    `.trim();
    return { from, to: [email], subject, html: body };
  });

  // Send via Resend batch (max 100 per call)
  const chunkSize = 100;
  for (let i = 0; i < batch.length; i += chunkSize) {
    const chunk = batch.slice(i, i + chunkSize);
    await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(chunk),
    });
  }
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
