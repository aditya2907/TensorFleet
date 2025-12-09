import { createTheme } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import { typography } from './typography';
import { createComponents } from './components';
import { shadows } from './shadows';
import { shape } from './shape';
import { spacing } from './spacing';
import { transitions } from './transitions';

// Create light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    ...lightPalette,
  },
  typography,
  shape,
  spacing,
  transitions,
  components: createComponents('light', lightPalette),
  shadows: shadows('light'),
});

// Create dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    ...darkPalette,
  },
  typography,
  shape,
  spacing,
  transitions,
  components: createComponents('dark', darkPalette),
  shadows: shadows('dark'),
});

// Default export for backwards compatibility
export const theme = lightTheme;

// Theme creation function for dynamic mode switching
export const createAppTheme = (mode = 'light') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
