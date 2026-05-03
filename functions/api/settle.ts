// Cloudflare Pages Function: POST /api/settle
// Admin-only endpoint that settles an issue and triggers RPC to backfill judgments.
// Reference: GDD §6.3 + plan M4.3

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  BREVO_API_KEY?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
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
  if (env.BREVO_API_KEY && body.result !== 'cancelled') {
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

  const fromEmail = env.FROM_EMAIL ?? 'noreply@jiziyi.asia';
  const fromName = env.FROM_NAME ?? '灼见';
  const settlementBool = result === 'correct';

  // Send via Brevo transactional email API (one call per recipient, batched by 50)
  for (const { userId, email } of emails) {
    const judgment = judgments.find((j) => j.user_id === userId);
    const isCorrect = judgment ? judgment.stance === settlementBool : false;
    const countsTowardRank = judgment?.counts_toward_rank ?? false;
    const rankNote = countsTowardRank ? '' : '（围观判断，不计段位）';
    const subject = isCorrect
      ? `✓ 你猜对了！《${issue.title}》`
      : `✕ 这次看走眼了《${issue.title}》`;
    const htmlContent = `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="font-size:18px;color:#131210">议题结算通知</h2>
  <p style="color:#3A3833">《${issue.title}》</p>
  <p><strong>结算结果：${result === 'correct' ? '✅ 支持方正确' : '❌ 反对方正确'}</strong></p>
  <p>你的判断：<strong>${judgment?.stance ? '支持' : '反对'}</strong> ${rankNote}</p>
  <p style="font-size:16px">${isCorrect ? '🎉 预测正确！准确率 +1，段位更新了' : '🙁 这次没押中，下次加油'}</p>
  <a href="https://www.jiziyi.asia/me" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#1A73E8;color:#fff;border-radius:8px;text-decoration:none">查看我的段位 →</a>
  <p style="margin-top:24px;font-size:12px;color:#999">灼见 · 比世界快一步 · <a href="https://www.jiziyi.asia" style="color:#999">jiziyi.asia</a></p>
</div>`.trim();

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email }],
        subject,
        htmlContent,
      }),
    });
  }
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
