import { TOKENS } from '../tokens';

export type TabName = '议题' | '广场' | '我';

interface TabBarProps {
  active: TabName;
  onTabChange?: (tab: TabName) => void;
}

const TABS: TabName[] = ['议题', '广场', '我'];

export function TabBar({ active, onTabChange }: TabBarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
        maxWidth: 600,
        margin: '0 auto',
        height: 56,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 999,
        boxShadow: TOKENS.shadowMd,
        display: 'flex',
        alignItems: 'center',
        padding: 6,
        zIndex: 30,
      }}
    >
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onTabChange?.(t)}
          style={{
            flex: 1,
            padding: 10,
            fontSize: 13,
            fontWeight: active === t ? 700 : 500,
            background: active === t ? TOKENS.indigo50 : 'transparent',
            color: active === t ? TOKENS.indigo700 : TOKENS.warm500,
            border: 'none',
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: TOKENS.fontSans,
            letterSpacing: '0.02em',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
