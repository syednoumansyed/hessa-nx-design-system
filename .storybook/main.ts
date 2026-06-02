import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    'storybook-addon-pseudo-states',
  ],

  framework: {
    name: '@storybook/angular',
    options: {},
  },

  staticDirs: [
    { from: '../src/assets/i18n', to: '/i18n' },
    {
      from: '../node_modules/@taiga-ui/icons/src',
      to: '/assets/taiga-ui/icons',
    },
  ],
};
export default config;
