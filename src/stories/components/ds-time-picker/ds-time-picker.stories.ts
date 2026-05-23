import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsTimePickerComponent } from '@ds/time-picker/time-picker.component';

/**
 * # Time Picker — `ds-time-picker`
 *
 * An Ionic-based iOS-style picker control for selecting a time of day. Supports custom minute steps
 * and adapts column ordering automatically for RTL languages.
 *
 * **When to use:**
 * - Selecting class schedules, appointment slots, or alarm settings
 * - Restricting minutes to specific intervals (e.g., every 15 minutes)
 *
 * **When NOT to use:**
 * - Date selection → use `ds-calendar`
 * - Selecting relative duration (e.g., "2 hours") → use a numeric input
 */
const meta: Meta<DsTimePickerComponent> = {
  title: '3. P2 Components/Time Picker',
  component: DsTimePickerComponent,
  tags: ['autodocs'],
  argTypes: {
    minuteStep: { control: 'number', description: 'Step size for minute selection' },
    disabled: { control: 'boolean' },
    lang: { control: 'select', options: ['en', 'ar'] },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsTimePickerComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="max-width:320px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:white;">${story}</div>`
    ),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<DsTimePickerComponent>;

export const Default: Story = {
  args: {
    minuteStep: 1,
    disabled: false,
    lang: 'en',
  },
};

export const MinuteStep15: Story = {
  name: 'Minute Step: 15',
  args: {
    minuteStep: 15,
    disabled: false,
    lang: 'en',
  },
};

export const MinuteStep30: Story = {
  name: 'Minute Step: 30',
  args: {
    minuteStep: 30,
    disabled: false,
    lang: 'en',
  },
};

export const Disabled: Story = {
  name: 'State: Disabled',
  args: {
    disabled: true,
    lang: 'en',
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    lang: 'en',
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;">${story}</div>`
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    lang: 'ar',
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;">${story}</div>`
    ),
  ],
};
