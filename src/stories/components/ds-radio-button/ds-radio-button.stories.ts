import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsRadioComponent } from '@ds/radio-button/radio/radio.component';

/**
 * # Radio Button — `app-ds-radio`
 *
 * The atomic selection control for mutually exclusive options. Typically used inside
 * `app-ds-radio-group`, but can be used standalone.
 *
 * **When to use:**
 * - Selecting a single option from a small list (2–5 items)
 * - Where options are mutually exclusive
 *
 * **When NOT to use:**
 * - Multi-select scenarios → use `ds-checkbox`
 * - Large number of options (5+) → use `ds-select`
 * - Toggle state → use `ds-switch` or `ds-chip`
 */
const meta: Meta<DsRadioComponent> = {
  title: '2. P1 Components/Radio Button (Atom)',
  component: DsRadioComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Label text shown next to the radio button' },
    size: { control: 'select', options: ['sm', 'lg'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsRadioComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="padding:16px;">${story}</div>`
    ),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<DsRadioComponent>;

export const Default: Story = {
  args: {
    title: 'Option label',
    size: 'lg',
    disabled: false,
    required: false,
  },
};

export const Checked: Story = {
  name: 'State: Checked',
  render: (args) => ({
    props: args,
    template: `<app-ds-radio [title]="title" [size]="size" [disabled]="disabled" [required]="required" [checked]="true" />`,
  }),
  args: {
    title: 'Selected Option',
    size: 'lg',
  },
};

export const SizeSm: Story = {
  name: 'Size: sm',
  args: {
    title: 'Small radio button',
    size: 'sm',
  },
};

export const SizeLg: Story = {
  name: 'Size: lg',
  args: {
    title: 'Large radio button',
    size: 'lg',
  },
};

export const Disabled: Story = {
  name: 'State: Disabled',
  args: {
    title: 'Disabled radio button',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  name: 'State: Disabled & Checked',
  render: (args) => ({
    props: args,
    template: `<app-ds-radio [title]="title" [size]="size" [disabled]="true" [checked]="true" />`,
  }),
  args: {
    title: 'Disabled and Checked',
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio title="English (UK)" size="lg" [checked]="true"></app-ds-radio>
        <app-ds-radio title="English (US)" size="lg"></app-ds-radio>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;">${story}</div>`
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio title="اللغة العربية" size="lg" [checked]="true"></app-ds-radio>
        <app-ds-radio title="اللغة الإنجليزية" size="lg"></app-ds-radio>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;">${story}</div>`
    ),
  ],
};
