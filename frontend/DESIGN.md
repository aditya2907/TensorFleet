# TensorFleet Frontend Design System

A clean, professional "ML infrastructure console" aesthetic. Indigo brand on slate
neutrals, dark sidebar, subtle depth. All styling flows from theme tokens in
`src/theme/` — feature components must not hardcode colors.

## Rules

1. **No hardcoded hex colors** in components. Use `theme.palette.*` tokens
   (`primary`, `secondary`, `success`, `warning`, `error`, `info`, `grey`,
   `text.*`, `divider`, `background.*`) and `alpha()` from `@mui/material/styles`
   for tints. Custom tokens: `theme.palette.sidebar.*`, `theme.palette.gradients.brand`.
2. **No gradient text, no glassmorphism, no `backdropFilter`, no hover
   `transform: translateY/scale` on cards or buttons.** The theme already
   handles hover states.
3. **Cards**: use plain `<Card>` — the theme gives it a 14px radius, 1px border,
   soft shadow. Don't override elevation or background.
4. **Stat / metric numbers**: `Typography variant="h3"` with `fontWeight: 700`
   (tabular numerals are baked into the type scale). Labels above numbers use
   `variant="overline" color="text.secondary"`.
5. **Icon badges**: 42×42 box, `borderRadius: '12px'`, background
   `alpha(theme.palette[color].main, dark ? 0.16 : 0.1)`, icon colored
   `theme.palette[color].main`, `fontSize="small"`.
6. **Status chips**: `<Chip size="small" color={...}>` — the theme renders
   semantic colors as soft tints. Mapping: RUNNING→info, PENDING→warning,
   COMPLETED→success, FAILED→error, CANCELLED→default.
7. **Section headers inside cards**: small primary-colored icon + `variant="h6"`,
   optional right-aligned action/chip.
8. **IDs, hashes, log output**: monospace via
   `import { monoFontFamily } from '../theme/typography'` →
   `sx={{ fontFamily: monoFontFamily }}`.
9. **Empty states**: muted icon (`color: 'text.disabled'`, ~40px), one
   `body2 color="text.secondary"` line, centered, generous padding.
10. **Polling**: use `usePolling` from `src/hooks/usePolling` instead of raw
    `setInterval` — it pauses when the tab is hidden. Minimum interval 5s.
11. **Errors**: surface via `getErrorMessage(error)` from `src/api/api.js`;
    remove `console.log` debug noise (keep `console.error` for real failures).
12. **Spacing**: `Grid` spacing 2.5–3; rely on the theme's CardContent padding.
13. **Loading**: use `<Skeleton>` for first paint, not spinners, where practical.
14. Buttons, inputs, dialogs, tables, tabs: accept theme defaults; don't restyle.
