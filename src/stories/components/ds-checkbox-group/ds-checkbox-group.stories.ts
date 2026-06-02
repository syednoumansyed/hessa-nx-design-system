import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { AfterViewInit, Component } from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsCheckboxGroupComponent } from '@ds/checkbox-group/checkbox-group.component';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';

@Component({
  selector: 'story-checkbox-group-validation',
  standalone: true,
  imports: [ReactiveFormsModule, DsCheckboxGroupComponent, DsCheckboxComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <app-ds-checkbox-group [formControl]="skillsControl" [required]="true">
        <app-ds-checkbox title="I agree to the terms" value="agree" />
      </app-ds-checkbox-group>
      @if (skillsControl.touched && skillsControl.hasError('required')) {
        <span role="alert" style="color:#ef4444;font-size:13px;">
          Select at least one option.
        </span>
      }
    </div>
  `,
})
class StoryCheckboxGroupValidationComponent implements AfterViewInit {
  skillsControl = new FormControl<string[]>([], {
    nonNullable: true,
    validators: [Validators.required],
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.skillsControl.markAsTouched();
      this.skillsControl.updateValueAndValidity();
    });
  }
}

/**
 * # Checkbox Group — `app-ds-checkbox-group`
 *
 * A CVA-compliant group wrapper that coordinates a set of `app-ds-checkbox`
 * children. Manages multi-select state, optional "Select All" with
 * indeterminate support, and required validation.
 *
 * **When to use:**
 * - Multiple independent boolean choices in a form
 * - "Select all" patterns (add a child checkbox with `value="SELECT_ALL"`)
 *
 * **When NOT to use:**
 * - Mutually exclusive choices → use `ds-radio-group`
 * - Single on/off action → use `ds-switch`
 *
 * **Responsive tokens:** Uses `--ds-spacing-*` via child `app-ds-checkbox`.
 */
const meta: Meta<DsCheckboxGroupComponent> = {
  title: '1. P0 Components/Checkbox Group',
  component: DsCheckboxGroupComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-select checkbox group. Wraps `app-ds-checkbox` children, managing shared selection state. Supports "Select All" with indeterminate variant. Uses self-responsive tokens via child checkboxes.',
      },
    },
    a11y: { config: { rules: [{ id: 'label', enabled: true }] } },
  },
  argTypes: {
    required: {
      control: 'boolean',
      description:
        'Requires at least one child checkbox selection for form validation.',
    },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({
      imports: [
        DsCheckboxGroupComponent,
        DsCheckboxComponent,
        ReactiveFormsModule,
        StoryCheckboxGroupValidationComponent,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<DsCheckboxGroupComponent>;

// ─── Basic Group ──────────────────────────────────────────────────────────────

export const Basic: Story = {
  name: 'Basic (3 options)',
  render: () => ({
    props: {
      selectedControl: new FormControl<string[]>([], { nonNullable: true }),
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-checkbox-group [formControl]="selectedControl">
          <app-ds-checkbox title="Reading" value="reading" />
          <app-ds-checkbox title="Writing" value="writing" />
          <app-ds-checkbox title="Listening" value="listening" />
        </app-ds-checkbox-group>
        <p aria-live="polite" style="margin:0;font-size:13px;color:#4b5563;">
          Selected: {{ selectedControl.value.length ? selectedControl.value.join(', ') : 'none' }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reading = canvas.getByRole('checkbox', { name: 'Reading' });
    const writing = canvas.getByRole('checkbox', { name: 'Writing' });
    const status = canvas.getByText(/Selected:/);

    await expect(status).toHaveTextContent('Selected: none');

    await userEvent.click(reading);
    await expect(reading).toBeChecked();
    await waitFor(() => {
      expect(status).toHaveTextContent('Selected: reading');
    });

    await userEvent.click(writing);
    await expect(writing).toBeChecked();
    await waitFor(() => {
      expect(status).toHaveTextContent('Selected: reading, writing');
    });
  },
};

// ─── With Select All ──────────────────────────────────────────────────────────

export const WithSelectAll: Story = {
  name: 'With Select All',
  render: () => ({
    props: {
      selectedControl: new FormControl<string[]>([], { nonNullable: true }),
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-checkbox-group [formControl]="selectedControl">
          <app-ds-checkbox title="Select All" value="SELECT_ALL" />
          <app-ds-checkbox title="Math" value="math" />
          <app-ds-checkbox title="Science" value="science" />
          <app-ds-checkbox title="English" value="english" />
        </app-ds-checkbox-group>
        <p aria-live="polite" style="margin:0;font-size:13px;color:#4b5563;">
          Selected subjects: {{ selectedControl.value.length ? selectedControl.value.join(', ') : 'none' }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selectAll = canvas.getByRole('checkbox', { name: 'Select All' });
    const math = canvas.getByRole('checkbox', { name: 'Math' });
    const science = canvas.getByRole('checkbox', { name: 'Science' });
    const english = canvas.getByRole('checkbox', { name: 'English' });
    const status = canvas.getByText(/Selected subjects:/);

    await userEvent.click(selectAll);
    await expect(math).toBeChecked();
    await expect(science).toBeChecked();
    await expect(english).toBeChecked();
    await waitFor(() => {
      expect(status).toHaveTextContent(
        'Selected subjects: math, science, english',
      );
    });

    await userEvent.click(science);
    await expect(science).not.toBeChecked();
    await expect(selectAll).toBePartiallyChecked();
    await waitFor(() => {
      expect(status).toHaveTextContent('Selected subjects: math, english');
    });
  },
};

// ─── Required Validation ─────────────────────────────────────────────────────

export const Required: Story = {
  name: 'Required (validation)',
  render: () => ({
    template: `<story-checkbox-group-validation />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Select at least one option.',
    );

    await userEvent.click(
      canvas.getByRole('checkbox', { name: 'I agree to the terms' }),
    );

    await waitFor(() => {
      expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    });
  },
};

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => ({
    props: {
      selectedControl: new FormControl<string[]>([], { nonNullable: true }),
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-checkbox-group [formControl]="selectedControl">
          <app-ds-checkbox title="Available" value="available" />
          <app-ds-checkbox title="Disabled option" value="disabled-opt" [disabled]="true" />
          <app-ds-checkbox title="Also available" value="also-available" />
        </app-ds-checkbox-group>
        <p aria-live="polite" style="margin:0;font-size:13px;color:#4b5563;">
          Selected availability: {{ selectedControl.value.length ? selectedControl.value.join(', ') : 'none' }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const available = canvas.getByRole('checkbox', { name: 'Available' });
    const disabledOption = canvas.getByRole('checkbox', {
      name: 'Disabled option',
    });
    const status = canvas.getByText(/Selected availability:/);

    await expect(disabledOption).toBeDisabled();
    await userEvent.click(disabledOption);
    await expect(disabledOption).not.toBeChecked();
    await expect(status).toHaveTextContent('Selected availability: none');

    await userEvent.click(available);
    await expect(available).toBeChecked();
    await waitFor(() => {
      expect(status).toHaveTextContent('Selected availability: available');
    });
  },
};

// ─── Small Size ──────────────────────────────────────────────────────────────

export const SmallSize: Story = {
  name: 'Size: sm',
  render: () => ({
    template: `
      <app-ds-checkbox-group>
        <app-ds-checkbox title="Option A" value="a" size="sm" />
        <app-ds-checkbox title="Option B" value="b" size="sm" />
        <app-ds-checkbox title="Option C" value="c" size="sm" />
      </app-ds-checkbox-group>
    `,
  }),
};

// ─── LTR ──────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <app-ds-checkbox-group>
        <app-ds-checkbox title="Reading comprehension" value="reading" />
        <app-ds-checkbox title="Creative writing" value="writing" />
        <app-ds-checkbox title="Listening exercises" value="listening" />
      </app-ds-checkbox-group>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};

// ─── RTL ──────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <app-ds-checkbox-group>
        <app-ds-checkbox title="اختر الكل" value="SELECT_ALL" />
        <app-ds-checkbox title="الرياضيات" value="math" />
        <app-ds-checkbox title="العلوم" value="science" />
        <app-ds-checkbox title="اللغة العربية" value="arabic" />
      </app-ds-checkbox-group>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};
