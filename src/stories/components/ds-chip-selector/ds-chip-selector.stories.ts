import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsChipSelectorComponent } from '@ds/chip-selector/chip-selector.component';

/**
 * # Chip Selector — `app-ds-chip-selector`
 *
 * A CVA-compliant chip-based multi/single-select component. Renders a row of
 * pill or card chips that users toggle to make selections. Ideal for filter
 * panels and categorical choices.
 *
 * **When to use:**
 * - Selecting one or several items from a compact, visible list (≤8 options)
 * - Filter bars (subject, grade, category)
 *
 * **When NOT to use:**
 * - Large lists (>10 options) → use `app-ds-select` or `app-ds-picker-select`
 * - Single on/off toggle → use `ds-switch`
 *
 * **Responsive tokens:** Chip padding uses `--ds-spacing-sm`/`--ds-spacing-md`.
 */
const meta: Meta<DsChipSelectorComponent> = {
  title: '1. P0 Components/Chip Selector',
  component: DsChipSelectorComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chip-based selection control (single or multi). Renders pill or card chips. Uses self-responsive spacing tokens automatically.',
      },
    },
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    displayType: { control: 'select', options: ['pill', 'card'] },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsChipSelectorComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsChipSelectorComponent>;

const subjectOptions = [
  { value: 'math', displayedValue: 'Math' },
  { value: 'science', displayedValue: 'Science' },
  { value: 'english', displayedValue: 'English' },
  { value: 'art', displayedValue: 'Art' },
];

// ─── Single Select ────────────────────────────────────────────────────────────

export const SingleSelect: Story = {
  name: 'Single Select',
  args: {
    options: subjectOptions,
    multiple: false,
    displayType: 'pill',
  },
};

// ─── Multi Select ─────────────────────────────────────────────────────────────

export const MultiSelect: Story = {
  name: 'Multi Select',
  args: {
    options: subjectOptions,
    multiple: true,
    displayType: 'pill',
  },
};

// ─── Card Display ─────────────────────────────────────────────────────────────

export const CardDisplay: Story = {
  name: 'Display: card',
  args: {
    options: subjectOptions,
    multiple: true,
    displayType: 'card',
  },
};

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    options: subjectOptions,
    multiple: false,
    disabled: true,
  },
};

// ─── With Disabled Options ────────────────────────────────────────────────────

export const WithDisabledOptions: Story = {
  name: 'With Disabled Options',
  args: {
    options: [
      { value: 'math', displayedValue: 'Math' },
      { value: 'science', displayedValue: 'Science', disabled: true },
      { value: 'english', displayedValue: 'English' },
      { value: 'history', displayedValue: 'History', disabled: true },
    ],
    multiple: true,
    displayType: 'pill',
  },
};

// ─── LTR ──────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    options: [
      { value: 'all', displayedValue: 'All' },
      { value: 'reading', displayedValue: 'Reading' },
      { value: 'writing', displayedValue: 'Writing' },
      { value: 'speaking', displayedValue: 'Speaking' },
    ],
    multiple: true,
    displayType: 'pill',
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};

// ─── RTL ──────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    options: [
      { value: 'all', displayedValue: 'الكل' },
      { value: 'reading', displayedValue: 'القراءة' },
      { value: 'writing', displayedValue: 'الكتابة' },
      { value: 'speaking', displayedValue: 'المحادثة' },
    ],
    multiple: true,
    displayType: 'pill',
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};
