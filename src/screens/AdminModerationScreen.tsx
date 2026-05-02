import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../components/tokens';
import { Btn, PageHeader, Pill } from '../components/shared';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Profile = Database['public']['Tables']['profiles']['Row'];
type BannedWord = Database['public']['Tables']['banned_words']['Row'];

type Tab = 'profiles' | 'words';
const TABS: { id: Tab; label: string }[] = [
  { id: 'profiles', label: '用户头像' },
  { id: 'words', label: '违禁词' },
];

export function AdminModerationScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profiles');

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title="内容审核" back onBack={() => navigate('/')} />

      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          borderBottom: `1px solid ${TOKENS.warm100}`,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 999,
              border: 'none',
              background: tab === t.id ? TOKENS.warm800 : '#fff',
              color: tab === t.id ? '#fff' : TOKENS.warm700,
              boxShadow: tab === t.id ? 'none' : `inset 0 0 0 1px ${TOKENS.warm100}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: TOKENS.fontSans,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 16px' }}>
        {tab === 'profiles' && <ProfilesList />}
        {tab === 'words' && <BannedWordsList />}
      </div>
    </div>
  );
}

function ProfilesList() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('joined_at', { ascending: false })
      .limit(50);
    setProfiles(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function clearAvatar(id: string) {
    if (!confirm('清除该用户头像？')) return;
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  if (loading) return <Loading />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {profiles.length === 0 && <Empty />}
      {profiles.map((p) => (
        <div
          key={p.id}
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: 14,
            boxShadow: TOKENS.shadowSm,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {p.avatar_url ? (
            <img
              src={p.avatar_url}
              alt=""
              style={{ width: 40, height: 40, borderRadius: 999, objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: TOKENS.warm100,
                color: TOKENS.warm600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {p.name?.[0] ?? '?'}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.warm800 }}>
              {p.name}
              {p.is_admin && (
                <span
                  style={{
                    fontSize: 9,
                    background: TOKENS.indigo50,
                    color: TOKENS.indigo700,
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontWeight: 700,
                    marginLeft: 6,
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: TOKENS.warm500, fontFamily: TOKENS.fontMono }}>
              @{p.handle}
            </div>
            {p.bio && (
              <div style={{ fontSize: 12, color: TOKENS.warm600, marginTop: 4 }}>
                {p.bio}
              </div>
            )}
          </div>
          {p.avatar_url && !p.is_admin && (
            <button
              type="button"
              onClick={() => clearAvatar(p.id)}
              style={{
                padding: '6px 10px',
                fontSize: 11,
                color: TOKENS.wrong,
                background: 'transparent',
                border: `1px solid ${TOKENS.warm200}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: TOKENS.fontSans,
              }}
            >
              清头像
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function BannedWordsList() {
  const [words, setWords] = useState<BannedWord[]>([]);
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState<'terror' | 'explosive' | 'porn' | 'political' | 'other'>('other');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('banned_words')
      .select('*')
      .order('added_at', { ascending: false });
    setWords(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    setError('');
    if (!newWord.trim()) return;
    const { error: e } = await supabase
      .from('banned_words')
      .insert({ word: newWord.trim(), category: newCategory });
    if (e) { setError(e.message); return; }
    setNewWord('');
    await load();
  }

  async function remove(id: string) {
    if (!confirm('确定删除？')) return;
    await supabase.from('banned_words').delete().eq('id', id);
    await load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: TOKENS.shadowSm }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="新违禁词"
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${TOKENS.warm200}`,
              fontSize: 13,
              fontFamily: TOKENS.fontSans,
              outline: 'none',
            }}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as typeof newCategory)}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${TOKENS.warm200}`,
              fontSize: 13,
              fontFamily: TOKENS.fontSans,
            }}
          >
            <option value="terror">涉恐</option>
            <option value="explosive">涉爆</option>
            <option value="porn">涉黄</option>
            <option value="political">涉政</option>
            <option value="other">其他</option>
          </select>
          <Btn kind="primary" size="sm" onClick={add} disabled={!newWord.trim()}>
            添加
          </Btn>
        </div>
        {error && (
          <div style={{ fontSize: 12, color: TOKENS.wrong, marginTop: 6 }}>{error}</div>
        )}
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {words.map((w) => (
            <div
              key={w.id}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: '8px 12px',
                boxShadow: TOKENS.shadowSm,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Pill kind={categoryKind(w.category)} size="sm">
                {categoryLabel(w.category)}
              </Pill>
              <span style={{ fontSize: 13, color: TOKENS.warm800, fontWeight: 500, flex: 1 }}>
                {w.word}
              </span>
              <button
                type="button"
                onClick={() => remove(w.id)}
                style={{
                  fontSize: 11,
                  color: TOKENS.warm500,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function categoryKind(c: string | null): 'wrong' | 'pending' | 'oppose' | 'neutral' | 'indigo' {
  switch (c) {
    case 'terror': return 'wrong';
    case 'explosive': return 'pending';
    case 'porn': return 'oppose';
    case 'political': return 'indigo';
    default: return 'neutral';
  }
}
function categoryLabel(c: string | null): string {
  return ({ terror: '涉恐', explosive: '涉爆', porn: '涉黄', political: '涉政' } as Record<string, string>)[c ?? ''] ?? '其他';
}

function Loading() {
  return (
    <div style={{ color: TOKENS.warm500, padding: 20, textAlign: 'center' }}>
      {COPY.loading}
    </div>
  );
}
function Empty() {
  return (
    <div
      style={{
        color: TOKENS.warm500,
        padding: 28,
        textAlign: 'center',
        background: '#fff',
        borderRadius: 14,
        boxShadow: TOKENS.shadowSm,
        fontSize: 13,
      }}
    >
      暂无内容
    </div>
  );
}

