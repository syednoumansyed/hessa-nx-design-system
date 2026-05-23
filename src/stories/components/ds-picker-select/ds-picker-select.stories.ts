import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { DsPickerSelectComponent } from '@ds/picker-select/picker-select.component';
import type { DsPickerSelectConfig } from '@ds/picker-select/picker-select.interface';

/**
 * # Picker Select — `app-ds-picker-select`
 *
 * A bottom-sheet based picker for selecting items from a large list. A trigger
 * button (with label and chevron) opens a full `DsModal` with a searchable
 * list of options. Supports single and multi-select modes.
 *
 * **When to use:**
 * - Selecting from a list too large to show as chips (>8 options)
 * - Hierarchical item selection requiring a dedicated modal step
 *
 * **When NOT to use:**
 * - Short lists (≤8 items) visible at once → use `app-ds-chip-selector`
 * - Simple single dropdowns → use `app-ds-select`
 *
 * **Responsive tokens:** Trigger button padding uses `--ds-spacing-lg`. Label uses `--font-size-sm`.
 *
 * > **Note:** The picker opens an Ionic modal. In Storybook, clicking the
 * > trigger shows the modal overlay above the canvas.
 */
const meta: Meta<DsPickerSelectComponent> = {
  title: '1. P0 Components/Picker Select',
  component: DsPickerSelectComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bottom-sheet picker for large item lists. Required `[config]` input. Opens an Ionic modal overlay with search. Supports single/multi selection. Uses self-responsive tokens.',
      },
    },
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
  decorators: [
    applicationConfig({
      providers: [
        provideIonicAngular(),
        provideHttpClient(),
      ],
    }),
    moduleMetadata({ imports: [DsPickerSelectComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsPickerSelectComponent>;

// ─── Single Select ────────────────────────────────────────────────────────────

const singleConfig: DsPickerSelectConfig = {
  label: 'Select Subject',
  placeholder: 'Choose a subject...',
  isMultiple: false,
  options: [
    { id: '1', display: 'Mathematics' },
    { id: '2', display: 'Science' },
    { id: '3', display: 'English' },
    { id: '4', display: 'Art & Design' },
    { id: '5', display: 'Physical Education' },
    { id: '6', display: 'Computer Science' },
  ],
  itemLabel: 'subjects',
};

export const SingleSelect: Story = {
  name: 'Single Select',
  render: () => ({
    props: { config: singleConfig },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
};

// ─── Multi Select ─────────────────────────────────────────────────────────────

const multiConfig: DsPickerSelectConfig = {
  label: 'Select Subjects',
  placeholder: 'Choose subjects...',
  isMultiple: true,
  options: [
    { id: '1', display: 'Mathematics' },
    { id: '2', display: 'Science' },
    { id: '3', display: 'English' },
    { id: '4', display: 'Art & Design' },
    { id: '5', display: 'Physical Education' },
  ],
  itemLabel: 'subjects',
};

export const MultiSelect: Story = {
  name: 'Multi Select',
  render: () => ({
    props: { config: multiConfig },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
};

// ─── Required ────────────────────────────────────────────────────────────────

export const Required: Story = {
  name: 'Required field',
  render: () => ({
    props: {
      config: {
        ...singleConfig,
        label: 'Select Grade *',
        required: true,
        options: [
          { id: '1', display: 'Grade 1' },
          { id: '2', display: 'Grade 2' },
          { id: '3', display: 'Grade 3' },
        ],
        itemLabel: 'grades',
      } as DsPickerSelectConfig,
    },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
};

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => ({
    props: {
      config: {
        ...singleConfig,
        label: 'Subject (disabled)',
        disabled: true,
      } as DsPickerSelectConfig,
    },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
};

// ─── No Label ─────────────────────────────────────────────────────────────────

export const NoLabel: Story = {
  name: 'No label',
  render: () => ({
    props: {
      config: {
        placeholder: 'Pick a student...',
        isMultiple: false,
        options: [
          { id: '1', display: 'Ahmed Al-Rashid' },
          { id: '2', display: 'Sara Al-Mansouri' },
          { id: '3', display: 'Omar Abdullah' },
        ],
      } as DsPickerSelectConfig,
    },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
};

// ─── LTR ──────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    props: { config: singleConfig },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;max-width:360px;">${story}</div>`,
    ),
  ],
};

// ─── RTL ──────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    props: {
      config: {
        label: 'اختر المادة',
        placeholder: 'اختر...',
        isMultiple: false,
        options: [
          { id: '1', display: 'الرياضيات' },
          { id: '2', display: 'العلوم' },
          { id: '3', display: 'اللغة العربية' },
          { id: '4', display: 'التربية الفنية' },
        ],
        itemLabel: 'مواد',
      } as DsPickerSelectConfig,
    },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:16px;max-width:360px;">${story}</div>`,
    ),
  ],
};

// ─── Student Role ─────────────────────────────────────────────────────────────

export const StudentRole: Story = {
  name: 'Student Role (tray border)',
  parameters: {
    docs: {
      description: {
        story:
          'Student theme: thick bottom-heavy border (`border-[4px] border-b-[8px]`) on the picker trigger — same tactile tray effect as `ds-input`. Set via `data-role="student"` on a parent.',
      },
    },
  },
  render: () => ({
    props: {
      config: {
        label: 'Select Subject',
        placeholder: 'Choose...',
        isMultiple: false,
        options: [
          { id: '1', display: 'Mathematics' },
          { id: '2', display: 'Science' },
          { id: '3', display: 'Arabic' },
        ],
        itemLabel: 'subject',
      },
    },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div data-role="student" style="padding:16px;max-width:360px;background:#fffbee;border-radius:12px;border:1px dashed #fed143;">${story}</div>`,
    ),
  ],
};
