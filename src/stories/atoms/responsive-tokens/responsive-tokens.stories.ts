import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { ResponsiveTokensComponent } from './responsive-tokens.component';

/**
 * # Responsive Token System
 *
 * All spacing, typography, and radius tokens are **self-responsive** — they
 * redefine their value at each breakpoint via `@media` overrides in the CSS.
 * Components never need to write their own media queries.
 *
 * **Breakpoints:**
 * - Mobile (default): < 768px
 * - Tablet: ≥ 768px
 * - Desktop (spacing/gap/radius): ≥ 1280px
 * - Desktop (typography): ≥ 1024px
 *
 * **How to use:**
 * ```css
 * .my-component {
 *   padding: var(--ds-spacing-md);        // 8px → 10px → 12px
 *   gap: var(--ds-gaps-sm);              // 4px → 6px → 8px
 *   border-radius: var(--ds-corner-radius-lg);  // 12px → 12px → 16px
 *   font-size: var(--font-size-lg);       // 16px → 18px → 20px
 * }
 * ```
 *
 * Resize the Storybook viewport (bottom-right handle or Viewport toolbar) to
 * see the tokens update live.
 */
const meta: Meta<ResponsiveTokensComponent> = {
  title: '0. Tokens/Responsive Tokens',
  component: ResponsiveTokensComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'All design tokens are responsive by default. Resize the viewport to see spacing, typography, and corner radius tokens adapt automatically — no media queries required in your component code.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [ResponsiveTokensComponent] }),
    componentWrapperDecorator((story) => `<div>${story}</div>`),
  ],
};

export default meta;
type Story = StoryObj<ResponsiveTokensComponent>;

export const AllTokens: Story = {
  name: 'All Tokens',
};

export const LTR: Story = {
  name: 'LTR (English)',
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr" style="font-family: 'Nunito', sans-serif;">${story}</div>`,
    ),
  ],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family: 'Lama Rounded', sans-serif;">${story}</div>`,
    ),
  ],
};
