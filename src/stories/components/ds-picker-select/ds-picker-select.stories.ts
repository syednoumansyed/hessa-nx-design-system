import {
  AfterViewInit,
  Component,
} from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsPickerSelectComponent } from '@ds/picker-select/picker-select.component';
import type { DsPickerSelectConfig } from '@ds/picker-select/picker-select.interface';

@Component({
  selector: 'story-picker-select-validation',
  standalone: true,
  imports: [ReactiveFormsModule, DsPickerSelectComponent],
  template: `
    <app-ds-picker-select [config]="config" [formControl]="control" />
  `,
})
class StoryPickerSelectValidationComponent implements AfterViewInit {
  control = new FormControl(null, Validators.required);
  config: DsPickerSelectConfig = {
    label: 'Select Subject',
    placeholder: 'Choose a subject...',
    isMultiple: false,
    options: [
      { id: '1', display: 'Mathematics' },
      { id: '2', display: 'Science' },
      { id: '3', display: 'English' },
    ],
    itemLabel: 'subjects',
  };

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.control.markAsTouched();
      this.control.updateValueAndValidity({ emitEvent: true });
    });
  }
}

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
  argTypes: {
    config: {
      control: 'object',
      description:
        'Picker trigger and modal options: label, placeholder, options, isMultiple, required, disabled, selectButtonText, and itemLabel.',
    },
  },
  decorators: [
    withHessaProviders({ http: true, mobile: false }),
    moduleMetadata({
      imports: [DsPickerSelectComponent, StoryPickerSelectValidationComponent],
    }),
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

export const DesktopModal: Story = {
  name: 'Desktop modal service branch',
  parameters: {
    docs: {
      description: {
        story:
          'Desktop Platform mock. Opening the picker uses DsModalService with the desktop Ionic modal/dialog branch.',
      },
    },
  },
  render: () => ({
    props: { config: singleConfig },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
  decorators: [withHessaProviders({ http: true, mobile: false })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Choose a subject...' }),
    );

    const body = within(document.body);
    await expect(await body.findByText('Select subjects')).toBeInTheDocument();
    await expect(await body.findByText('Mathematics')).toBeInTheDocument();
  },
};

export const MobileBottomSheet: Story = {
  name: 'Mobile bottom-sheet branch',
  parameters: {
    docs: {
      description: {
        story:
          'Mobile Platform mock. Opening the picker uses DsModalService mobile bottom-sheet behavior, not ModalSheetService.',
      },
    },
  },
  render: () => ({
    props: { config: singleConfig },
    template: `<app-ds-picker-select [config]="config" />`,
  }),
  decorators: [
    withHessaProviders({ http: true, mobile: true }),
    componentWrapperDecorator(
      (story) =>
        `<div class="mx-auto w-full max-w-sm bg-surface-primary p-ds-xl">${story}</div>`,
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Choose a subject...' }),
    );

    const body = within(document.body);
    await expect(await body.findByText('Select subjects')).toBeInTheDocument();
    await expect(await body.findByText('Mathematics')).toBeInTheDocument();
  },
};

// ─── Required ────────────────────────────────────────────────────────────────

export const Required: Story = {
  name: 'Required field',
  render: () => ({
    props: {
      config: {
        ...singleConfig,
        label: 'Select Grade',
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

export const Error: Story = {
  name: 'State: Error via FormControl',
  render: () => ({
    template: `<story-picker-select-validation />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('button', {
      name: /Choose a subject/i,
    });

    await expect(trigger).toHaveClass('border-error');
  },
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
    withHessaProviders({ http: true, locale: 'en', mobile: false }),
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" class="max-w-sm p-ds-xl">${story}</div>`,
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
    withHessaProviders({ http: true, locale: 'ar', mobile: false }),
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" class="max-w-sm p-ds-xl">${story}</div>`,
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
        `<div data-role="student" class="max-w-sm rounded-ds-xl border border-dashed border-warning-500 bg-warning-50 p-ds-xl">${story}</div>`,
    ),
  ],
};
