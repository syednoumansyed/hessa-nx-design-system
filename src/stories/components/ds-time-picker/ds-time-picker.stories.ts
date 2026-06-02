import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsTimePickerComponent } from '@ds/time-picker/time-picker.component';

const dispatchPickerChange = (column: Element, value: number | string) =>
  fireEvent(
    column,
    new CustomEvent('ionChange', {
      detail: { value },
      bubbles: true,
      composed: true,
    }),
  );

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
    moduleMetadata({ imports: [DsTimePickerComponent, ReactiveFormsModule] }),
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
  play: async ({ canvasElement }) => {
    const columns = Array.from(
      canvasElement.querySelectorAll('ion-picker-column'),
    );
    const minuteColumn = columns[1];

    if (!minuteColumn) {
      throw new Error('Minute picker column was not rendered.');
    }

    const minuteCanvas = within(minuteColumn as HTMLElement);
    await expect(minuteCanvas.getByText('00')).toBeInTheDocument();
    await expect(minuteCanvas.getByText('15')).toBeInTheDocument();
    await expect(minuteCanvas.getByText('30')).toBeInTheDocument();
    await expect(minuteCanvas.getByText('45')).toBeInTheDocument();
    await expect(minuteCanvas.queryByText('14')).not.toBeInTheDocument();
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

export const EmitsValue: Story = {
  name: 'Interaction: Emits selected time',
  render: () => ({
    props: {
      selectedControl: new FormControl('08:00 AM', { nonNullable: true }),
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <ds-time-picker
          [minuteStep]="15"
          lang="en"
          [formControl]="selectedControl"
          (valueChange)="selectedControl.setValue($event)"
        />
        <p aria-live="polite" style="margin:0;font-size:13px;color:#4b5563;">
          Selected time: {{ selectedControl.value }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const columns = Array.from(
      canvasElement.querySelectorAll('ion-picker-column'),
    );
    const [hourColumn, minuteColumn, meridiemColumn] = columns;
    const status = canvas.getByText(/Selected time:/);

    if (!hourColumn || !minuteColumn || !meridiemColumn) {
      throw new Error('Expected hour, minute, and meridiem picker columns.');
    }

    await expect(status).toHaveTextContent('Selected time: 08:00 AM');

    await dispatchPickerChange(hourColumn, 9);
    await dispatchPickerChange(minuteColumn, 30);
    await dispatchPickerChange(meridiemColumn, 'pm');

    await waitFor(() => {
      expect(status).toHaveTextContent('Selected time: 09:30 PM');
    });
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
  play: async ({ canvasElement }) => {
    const columns = Array.from(
      canvasElement.querySelectorAll('ion-picker-column'),
    );
    const [meridiemColumn, hourColumn, minuteColumn] = columns;

    if (!meridiemColumn || !hourColumn || !minuteColumn) {
      throw new Error('Expected RTL picker columns to render.');
    }

    await expect(
      within(meridiemColumn as HTMLElement).getByText('ص'),
    ).toBeInTheDocument();
    await expect(
      within(hourColumn as HTMLElement).getByText('01'),
    ).toBeInTheDocument();
    await expect(
      within(minuteColumn as HTMLElement).getByText('00'),
    ).toBeInTheDocument();
  },
};
