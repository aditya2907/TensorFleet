// Type scale — Inter for UI, tabular figures on metric-heavy variants
// so live numbers don't jitter as they update.

const fontFamily = [
  'Inter',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(',');

export const monoFontFamily = [
  '"JetBrains Mono"',
  'ui-monospace',
  'SFMono-Regular',
  'Menlo',
  'Consolas',
  'monospace',
].join(',');

const tabularNums = { fontVariantNumeric: 'tabular-nums' };

export const typography = {
  fontFamily,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: {
    fontWeight: 700,
    fontSize: '2.25rem',
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
    ...tabularNums,
  },
  h2: {
    fontWeight: 700,
    fontSize: '1.75rem',
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
    ...tabularNums,
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.3,
    letterSpacing: '-0.015em',
    ...tabularNums,
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.35,
    letterSpacing: '-0.01em',
    ...tabularNums,
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.0625rem',
    lineHeight: 1.45,
    letterSpacing: '-0.005em',
  },
  h6: {
    fontWeight: 600,
    fontSize: '0.9375rem',
    lineHeight: 1.5,
    letterSpacing: '-0.003em',
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.55,
  },
  subtitle2: {
    fontWeight: 600,
    fontSize: '0.8125rem',
    lineHeight: 1.5,
  },
  body1: {
    fontWeight: 400,
    fontSize: '0.9375rem',
    lineHeight: 1.55,
  },
  body2: {
    fontWeight: 400,
    fontSize: '0.8438rem',
    lineHeight: 1.5,
  },
  button: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.6,
    letterSpacing: '0.01em',
    textTransform: 'none',
  },
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    letterSpacing: '0.01em',
    ...tabularNums,
  },
  overline: {
    fontWeight: 600,
    fontSize: '0.6875rem',
    lineHeight: 1.6,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};
