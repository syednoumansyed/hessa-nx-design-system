import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const hessaTheme = create({
  base: 'light',

  // Brand
  brandTitle: 'Hessa Design System',
  brandUrl: '/',
  brandTarget: '_self',

  // UI chrome
  colorPrimary: '#1B6EF3',   // --colors-brand-500
  colorSecondary: '#1B6EF3',

  // App background
  appBg: '#F8FAFF',
  appContentBg: '#FFFFFF',
  appPreviewBg: '#FFFFFF',
  appBorderColor: '#E5E9F2',
  appBorderRadius: 8,

  // Toolbar
  barTextColor: '#4B5563',
  barHoverColor: '#1B6EF3',
  barSelectedColor: '#1B6EF3',
  barBg: '#FFFFFF',

  // Typography
  fontBase: '"Nunito", -apple-system, BlinkMacSystemFont, sans-serif',
  fontCode: '"Fira Code", "Fira Mono", monospace',

  // Text
  textColor: '#111827',
  textInverseColor: '#FFFFFF',
  textMutedColor: '#6B7280',

  // Form elements
  inputBg: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputTextColor: '#111827',
  inputBorderRadius: 6,
});

addons.setConfig({
  theme: hessaTheme,
  sidebar: {
    showRoots: true,
  },
});
