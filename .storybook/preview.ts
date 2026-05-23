import type { Preview } from '@storybook/angular';
import DocumentationTemplate from './DocumentationTemplate.mdx';

const VIEWPORTS = {
  mobile: { name: 'Mobile (375px)', styles: { width: '375px', height: '812px' }, type: 'mobile' },
  tablet: { name: 'Tablet (768px)', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
  desktop: { name: 'Desktop (1280px)', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
  desktopLg: { name: 'Desktop (1440px)', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
} as const;

const preview: Preview = {
  globalTypes: {
    role: {
      description: 'User role theme',
      defaultValue: 'personnel',
      toolbar: {
        title: 'Role',
        icon: 'user',
        items: [
          { value: 'personnel', title: 'Teacher (personnel)' },
          { value: 'student',   title: 'Student'             },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Direction / locale',
      defaultValue: 'ltr',
      toolbar: {
        title: 'Direction',
        icon: 'globe',
        items: [
          { value: 'ltr', right: '🇬🇧', title: 'LTR (English)' },
          { value: 'rtl', right: '🇸🇦', title: 'RTL (Arabic)'  },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (story, context) => {
      const role   = (context.globals as any)['role']   ?? 'personnel';
      const locale = (context.globals as any)['locale'] ?? 'ltr';
      const dir    = locale === 'rtl' ? 'rtl' : 'ltr';
      const lang   = locale === 'rtl' ? 'ar'  : 'en';

      document.documentElement.setAttribute('data-role', role);
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
      document.body.setAttribute('data-role', role);
      document.body.setAttribute('dir', dir);

      return story();
    },
  ],

  parameters: {
    viewport: {
      options: VIEWPORTS
    },
    docs: {
      page: DocumentationTemplate,
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  initialGlobals: {
    viewport: 'mobile',
  }
};

export default preview;
