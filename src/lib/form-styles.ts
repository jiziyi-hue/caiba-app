import { TOKENS } from '../components/tokens';

export const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${TOKENS.warm200}`,
  fontSize: 14,
  fontFamily: TOKENS.fontSans,
  outline: 'none',
};
