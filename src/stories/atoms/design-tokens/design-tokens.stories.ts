import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DesignTokensComponent } from './design-tokens.component';

/**
 * # Design Tokens
 *
 * Complete visual reference for all design primitives:
 *
 * - **Colors** — 380+ CSS custom properties from primitive palettes to semantic mappings
 * - **Semantic tokens** — purpose-named tokens that map to primitives
 * - **Spacing scale** — all `--ds-spacing-*` and `--ds-gaps-*` tokens with responsive values
 * - **Icons** — all 151 custom SVG assets from `src/assets/icons/`
 *
 * **Rules:**
 * - Always use semantic tokens in components (`--content-action`, `--surface-brand-default`)
 * - Never use primitive tokens directly in component code (`--colors-brand-500`)
 * - For spacing, always prefer `--ds-spacing-*` and `--ds-gaps-*` over arbitrary pixel values
 */
const meta: Meta<DesignTokensComponent> = {
  title: '0. Tokens/Design Tokens',
  component: DesignTokensComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Complete visual reference for the nx design system token system. 380+ color tokens, responsive spacing/gap/radius scales, and the full 151-icon SVG library.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DesignTokensComponent] }),
    componentWrapperDecorator((story) => `<div>${story}</div>`),
  ],
};

export default meta;
type Story = StoryObj<DesignTokensComponent>;

export const AllTokens: Story = {
  name: 'All Tokens',
};

export const ColorsOnly: Story = {
  name: 'Colors',
};

export const IconsOnly: Story = {
  name: 'Icons',
};

export const LTR: Story = {
  name: 'LTR (English)',
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family: 'Nunito', sans-serif;">${story}</div>`,
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
