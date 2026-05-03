import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { TOKENS } from '../components/tokens';
import { Avatar, Btn, PageHeader } from '../components/shared';

export function ProfileEditScreen() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (f.size > 5 * 1024 * 1024) { setError('头像不能超过 5MB'); return; }
    setSaving(true);
    setError('');
    try {
      // Delete old avatar files to prevent orphan storage growth
      const { data: existing } = await supabase.storage.from('avatars').list('', {
        search: user.id,
      });
      if (existing && existing.length > 0) {
        const oldPaths = existing.map((o) => o.name);
        await supabase.storage.from('avatars').remove(oldPaths);
      }
      const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, f, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const { error: e } = await supabase
        .from('profiles')
        .update({ name: name.trim(), bio: bio.trim() || null, avatar_url: avatarUrl || null })
        .eq('id', user.id);
      if (e) throw e;
      await refreshProfile();
      navigate('/me', { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader
        title="编辑资料"
        back
        onBack={() => navigate(-1)}
        action={
          <Btn kind="primary" size="sm" disabled={saving || !name.trim()} onClick={save}>
            保存
          </Btn>
        }
      />

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '28px 20px',
            boxShadow: TOKENS.shadowSm,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              width: 96,
              height: 96,
              padding: 0,
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="头像"
                style={{ width: 96, height: 96, borderRadius: 999, objectFit: 'cover' }}
              />
            ) : (
              <Avatar name={name[0] || '判'} size={96} tint="indigo" />
            )}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              fontSize: 13,
              color: TOKENS.indigo600,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {avatarUrl ? '更换头像' : '上传头像'}
          </button>
        </div>

        <Field label="昵称" value={name} onChange={setName} maxLength={16} />
        <Field label="简介" value={bio} onChange={setBio} maxLength={60} multiline />

        {error && (
          <div
            style={{
              fontSize: 13,
              color: TOKENS.wrong,
              background: TOKENS.wrongTint,
              padding: '10px 12px',
              borderRadius: 10,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  maxLength,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 16,
        boxShadow: TOKENS.shadowSm,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: TOKENS.warm500,
          fontFamily: TOKENS.fontMono,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          rows={3}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: 'none',
            outline: 'none',
            padding: 0,
            fontSize: 14,
            color: TOKENS.warm700,
            lineHeight: 1.55,
            resize: 'none',
            background: 'transparent',
            fontFamily: TOKENS.fontSans,
          }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: 'none',
            outline: 'none',
            padding: 0,
            fontSize: 17,
            fontWeight: 600,
            color: TOKENS.warm900,
            background: 'transparent',
            fontFamily: TOKENS.fontSans,
          }}
        />
      )}
      {maxLength && (
        <div
          style={{
            fontSize: 10,
            color: TOKENS.warm400,
            marginTop: 6,
            textAlign: 'right',
            fontFamily: TOKENS.fontMono,
          }}
        >
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}
