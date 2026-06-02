import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { expect, userEvent, within } from 'storybook/test';
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
    moduleMetadata({ imports: [DsRadioComponent, ReactiveFormsModule] }),
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole('radio', { name: 'Option label' });

    await expect(radio).not.toBeChecked();
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
  },
};

export const EmitsValue: Story = {
  name: 'Interaction: Emits value',
  render: () => ({
    props: { emitted: 'none' },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio
          title="Notify by SMS"
          value="sms"
          size="lg"
          (checkedChange)="emitted = $event"
        />
        <p aria-live="polite" style="margin:0;font-size:13px;color:#4b5563;">
          Emitted value: {{ emitted }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole('radio', { name: 'Notify by SMS' });
    const status = canvas.getByText(/Emitted value:/);

    await expect(status).toHaveTextContent('Emitted value: none');
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
    await expect(status).toHaveTextContent('Emitted value: sms');
  },
};

export const Checked: Story = {
  name: 'State: Checked',
  render: () => ({
    props: {
      checkedControl: new FormControl(true, { nonNullable: true }),
    },
    template: `<app-ds-radio title="Selected Option" size="lg" [formControl]="checkedControl" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('radio', { name: 'Selected Option' }),
    ).toBeChecked();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole('radio', { name: 'Disabled radio button' });

    await expect(radio).toBeDisabled();
    await userEvent.click(radio);
    await expect(radio).not.toBeChecked();
  },
};

export const DisabledChecked: Story = {
  name: 'State: Disabled & Checked',
  render: () => ({
    props: {
      checkedControl: new FormControl(
        { value: true, disabled: true },
        { nonNullable: true },
      ),
    },
    template: `<app-ds-radio title="Disabled and Checked" size="lg" [formControl]="checkedControl" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole('radio', { name: 'Disabled and Checked' });

    await expect(radio).toBeDisabled();
    await expect(radio).toBeChecked();
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    props: {
      englishUkControl: new FormControl(true, { nonNullable: true }),
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio title="English (UK)" size="lg" [formControl]="englishUkControl"></app-ds-radio>
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
    props: {
      arabicControl: new FormControl(true, { nonNullable: true }),
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio title="اللغة العربية" size="lg" [formControl]="arabicControl"></app-ds-radio>
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
