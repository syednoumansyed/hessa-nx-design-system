import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsExpandableComponent } from '@ds/expandable/expandable.component';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';

const translationProvider = {
  provide: DS_TRANSLATION_TOKEN,
  useValue: {
    translate: (key: string) => key,
    getActiveLang: () => 'en',
  },
};

/**
 * # Expandable — `ds-expandable`
 *
 * Collapses long content behind a "Show more / Show less" toggle. The toggle
 * only appears when the projected content exceeds `maxHeight` pixels.
 *
 * **Inputs:**
 * - `initiallyExpanded` — start open (default: `false`)
 * - `maxHeight` — pixel threshold before toggle appears (default: `100`)
 * - `showMoreText` — i18n key or literal for the expand label
 * - `showLessText` — i18n key or literal for the collapse label
 */
const meta: Meta<DsExpandableComponent> = {
  title: '3. P2 Components/Expandable',
  component: DsExpandableComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [provideIonicAngular(), translationProvider] }),
    moduleMetadata({ imports: [DsExpandableComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="max-width:480px;padding:16px;">${story}</div>`,
    ),
  ],
  argTypes: {
    initiallyExpanded: { control: 'boolean' },
    maxHeight: { control: 'number' },
    showMoreText: { control: 'text' },
    showLessText: { control: 'text' },
  },
  parameters: {
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          { id: 'button-name', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<DsExpandableComponent>;

const LONG_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
sunt in culpa qui officia deserunt mollit anim id est laborum.`;

const SHORT_TEXT = `Short content that does not exceed the height limit — no toggle will appear.`;

// ─── Default (collapsed) ──────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default — Collapsed',
  render: (args) => ({
    props: args,
    template: `
      <ds-expandable
        [maxHeight]="maxHeight"
        [initiallyExpanded]="initiallyExpanded"
        [showMoreText]="showMoreText"
        [showLessText]="showLessText"
      >
        <p style="margin:0;line-height:1.6;">${LONG_TEXT}</p>
      </ds-expandable>
    `,
  }),
  args: {
    initiallyExpanded: false,
    maxHeight: 80,
    showMoreText: 'Show more',
    showLessText: 'Show less',
  },
};

// ─── Initially expanded ───────────────────────────────────────────────────────

export const InitiallyExpanded: Story = {
  name: 'Initially Expanded',
  render: (args) => ({
    props: args,
    template: `
      <ds-expandable
        [maxHeight]="maxHeight"
        [initiallyExpanded]="initiallyExpanded"
        [showMoreText]="showMoreText"
        [showLessText]="showLessText"
      >
        <p style="margin:0;line-height:1.6;">${LONG_TEXT}</p>
      </ds-expandable>
    `,
  }),
  args: {
    initiallyExpanded: true,
    maxHeight: 80,
    showMoreText: 'Show more',
    showLessText: 'Show less',
  },
};

// ─── Short content (no toggle) ────────────────────────────────────────────────

export const ShortContent: Story = {
  name: 'Short Content — No Toggle',
  render: (args) => ({
    props: args,
    template: `
      <ds-expandable
        [maxHeight]="maxHeight"
        [initiallyExpanded]="initiallyExpanded"
        [showMoreText]="showMoreText"
        [showLessText]="showLessText"
      >
        <p style="margin:0;line-height:1.6;">${SHORT_TEXT}</p>
      </ds-expandable>
    `,
  }),
  args: {
    initiallyExpanded: false,
    maxHeight: 200,
    showMoreText: 'Show more',
    showLessText: 'Show less',
  },
};

// ─── Custom max height ────────────────────────────────────────────────────────

export const CustomMaxHeight: Story = {
  name: 'Custom Max Height (40px)',
  render: (args) => ({
    props: args,
    template: `
      <ds-expandable
        [maxHeight]="maxHeight"
        [initiallyExpanded]="initiallyExpanded"
        [showMoreText]="showMoreText"
        [showLessText]="showLessText"
      >
        <p style="margin:0;line-height:1.6;">${LONG_TEXT}</p>
      </ds-expandable>
    `,
  }),
  args: {
    initiallyExpanded: false,
    maxHeight: 40,
    showMoreText: 'Show more',
    showLessText: 'Show less',
  },
};

// ─── Rich content ─────────────────────────────────────────────────────────────

export const RichContent: Story = {
  name: 'Rich Content',
  render: (args) => ({
    props: args,
    template: `
      <ds-expandable
        [maxHeight]="maxHeight"
        [initiallyExpanded]="initiallyExpanded"
        [showMoreText]="showMoreText"
        [showLessText]="showLessText"
      >
        <h4 style="margin:0 0 8px;">Course Overview</h4>
        <ul style="margin:0;padding-left:20px;line-height:2;">
          <li>Introduction to algebra</li>
          <li>Linear equations and inequalities</li>
          <li>Quadratic equations</li>
          <li>Polynomial functions</li>
          <li>Rational expressions</li>
          <li>Radical expressions</li>
          <li>Systems of equations</li>
          <li>Exponential and logarithmic functions</li>
        </ul>
      </ds-expandable>
    `,
  }),
  args: {
    initiallyExpanded: false,
    maxHeight: 80,
    showMoreText: 'Show all topics',
    showLessText: 'Show fewer topics',
  },
};

// ─── RTL (Arabic) ─────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL — Arabic',
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="max-width:480px;padding:16px;font-family:'Lama Rounded',sans-serif;">${story}</div>`,
    ),
  ],
  render: (args) => ({
    props: args,
    template: `
      <ds-expandable
        [maxHeight]="maxHeight"
        [initiallyExpanded]="initiallyExpanded"
        [showMoreText]="showMoreText"
        [showLessText]="showLessText"
      >
        <p style="margin:0;line-height:1.8;">
          هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربي،
          حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التي
          يولدها التطبيق. إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربي زيادة عدد
          الفقرات كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربي مفيد لمصممي
          المواقع على وجه الخصوص.
        </p>
      </ds-expandable>
    `,
  }),
  args: {
    initiallyExpanded: false,
    maxHeight: 80,
    showMoreText: 'عرض المزيد',
    showLessText: 'عرض أقل',
  },
};

// ─── All Variants grid ────────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:24px;">
        <div>
          <p style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">Collapsed (long content)</p>
          <ds-expandable [maxHeight]="80" [showMoreText]="'Show more'" [showLessText]="'Show less'">
            <p style="margin:0;line-height:1.6;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          </ds-expandable>
        </div>
        <div>
          <p style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">Initially expanded</p>
          <ds-expandable [maxHeight]="80" [initiallyExpanded]="true" [showMoreText]="'Show more'" [showLessText]="'Show less'">
            <p style="margin:0;line-height:1.6;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          </ds-expandable>
        </div>
        <div>
          <p style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">Short content — no toggle</p>
          <ds-expandable [maxHeight]="200" [showMoreText]="'Show more'" [showLessText]="'Show less'">
            <p style="margin:0;">Short content that fits within the limit.</p>
          </ds-expandable>
        </div>
      </div>
    `,
  }),
};
