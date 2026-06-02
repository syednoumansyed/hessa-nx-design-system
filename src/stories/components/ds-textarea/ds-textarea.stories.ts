import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { AfterViewInit, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';

@Component({
  selector: 'story-textarea-validation',
  standalone: true,
  imports: [ReactiveFormsModule, DsTextareaComponent],
  template: `
    <div style="max-width:480px;display:flex;flex-direction:column;gap:8px;">
      <app-ds-textarea
        label="Required field"
        placeholder="This field is required"
        [required]="true"
        [rows]="4"
        [formControl]="notesControl"
      />
      @if (notesControl.touched && notesControl.hasError('required')) {
        <span role="alert" style="color:#ef4444;font-size:13px;padding-left:12px;">
          This field is required.
        </span>
      }
    </div>
  `,
})
class StoryTextareaValidationComponent implements AfterViewInit {
  notesControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.notesControl.markAsTouched();
      this.notesControl.updateValueAndValidity();
    });
  }
}

/**
 * # Text Area — `app-ds-textarea`
 *
 * A multi-line text input implementing `ControlValueAccessor`. Supports:
 * - Optional label with required asterisk
 * - Left and right hint text below the textarea
 * - Live character counter (with optional max-length cap)
 * - Disabled state
 * - Student-role 3-D thick border (add `data-role="student"` to a wrapper)
 *
 * No `errorMessage` signal input exists on this component — validation errors are
 * surfaced via the Angular `NG_VALIDATORS` token (reactive / template-driven forms).
 *
 * **Signal inputs:** `label`, `id`, `placeholder`, `required`, `hintLeft`, `hintRight`,
 * `showCharacterCount`
 * **Classic `@Input()`:** `rows`, `maxLength`, `disabled`
 */
const meta: Meta<DsTextareaComponent> = {
  title: '2. P1 Components/Text Area',
  component: DsTextareaComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Optional label above the textarea',
    },
    placeholder: { control: 'text' },
    required: {
      control: 'boolean',
      description: 'Marks the field required for form validation',
    },
    hintLeft: {
      control: 'text',
      description: 'Helper text below the textarea',
    },
    hintRight: {
      control: 'text',
      description: 'Secondary hint, often used for metadata or limits',
    },
    showCharacterCount: {
      control: 'boolean',
      description: 'Shows the live character counter',
    },
    rows: { control: 'number', description: 'Visible textarea rows' },
    maxLength: {
      control: 'number',
      description: 'Maximum allowed character count',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables input and applies muted styling',
    },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({
      imports: [DsTextareaComponent, StoryTextareaValidationComponent],
    }),
  ],
};

export default meta;
type Story = StoryObj<DsTextareaComponent>;

/** Basic textarea — no label, 4 rows, simple placeholder. */
export const Default: Story = {
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-ds-textarea
          placeholder="Write a comment..."
          [rows]="4"
        />
      </div>
    `,
  }),
};

/** With a visible label and required indicator. */
export const WithLabel: Story = {
  name: 'With Label',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-ds-textarea
          label="Description"
          placeholder="Enter a description..."
          [required]="true"
          [rows]="4"
        />
      </div>
    `,
  }),
};

/** Dual hint text — `hintLeft` for guidance, `hintRight` for extra metadata. */
export const WithHints: Story = {
  name: 'With Hints',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-ds-textarea
          label="Feedback"
          placeholder="Share your thoughts..."
          hintLeft="Be specific and constructive"
          hintRight="Optional"
          [rows]="4"
        />
      </div>
    `,
  }),
};

/** Live character counter with a hard max-length cap of 200 characters. */
export const CharacterCount: Story = {
  name: 'Character Count',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-ds-textarea
          label="Bio"
          placeholder="Tell us about yourself..."
          [showCharacterCount]="true"
          [maxLength]="200"
          [rows]="5"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText('Tell us about yourself...');

    fireEvent.input(textarea, {
      target: { value: 'Storybook typed note' },
    });

    await waitFor(() => {
      expect(textarea).toHaveValue('Storybook typed note');
      expect(canvas.getByText(/20\s*\/\s*200/)).toBeInTheDocument();
    });
  },
};

/** Disabled textarea — cursor not-allowed, muted colours. */
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-ds-textarea
          label="Notes"
          placeholder="No notes available"
          [disabled]="true"
          [rows]="4"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText('No notes available');

    await expect(textarea).toBeDisabled();
    await expect(textarea).toHaveValue('');
  },
};

/**
 * Error state — because `DsTextareaComponent` exposes validation via `NG_VALIDATORS`,
 * the error appearance is driven by the form layer. This story wraps the textarea in a
 * minimal reactive-forms setup to trigger the required validator visually.
 */
export const Error: Story = {
  render: () => ({
    template: `<story-textarea-validation />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'This field is required.',
    );

    await userEvent.type(
      canvas.getByPlaceholderText('This field is required'),
      'Resolved note',
    );

    await waitFor(() => {
      expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    });
  },
};

/**
 * Student Role — wrapping with `data-role="student"` activates the thick 3-D border
 * (4 px sides, 8 px bottom) that matches the ds-input student variant.
 */
export const StudentRole: Story = {
  name: 'Student Role (thick 3-D border)',
  render: () => ({
    template: `
      <div data-role="student" style="max-width:480px;">
        <app-ds-textarea
          label="My Answer"
          placeholder="Write your answer here..."
          [rows]="5"
        />
      </div>
    `,
  }),
};

/**
 * All stroke states — same border token system as `app-ds-input`.
 * Hover and focus borders are forced via scoped CSS so they render statically.
 */
export const AllStrokeStates: Story = {
  name: 'All stroke states',
  parameters: {
    docs: {
      description: {
        story: `
Textarea shares the same border/stroke token system as \`app-ds-input\`.

| State | Token | Hex | Condition |
|---|---|---|---|
| **Default** | \`neutral-cool-100\` | \`#e5e6e7\` | Idle |
| **Hover** | \`neutral-cool-200\` | \`#ccced0\` | \`:hover\` |
| **Focused** | \`neutral-cool-700\` | \`#4d545a\` | \`:focus\` |
| **Disabled** | \`neutral-cool-100\` | \`#e5e6e7\` | \`disabled=true\` + muted bg |

Note: textarea has no \`errorMessage\` input — validation errors come from the form layer (\`NG_VALIDATORS\`).
        `,
      },
    },
  },
  render: () => ({
    template: `
      <style>
        .stroke-hover textarea { border-color: #ccced0 !important; }
        .stroke-focus textarea { border-color: #4d545a !important; }
      </style>
      <div style="display:flex;flex-direction:column;gap:20px;max-width:480px;">

        <div>
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Default — neutral-cool-100 (#e5e6e7)</p>
          <app-ds-textarea label="Notes" placeholder="Idle state" [rows]="3" />
        </div>

        <div class="stroke-hover">
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Hover — neutral-cool-200 (#ccced0)</p>
          <app-ds-textarea label="Notes" placeholder="Hover state" [rows]="3" />
        </div>

        <div class="stroke-focus">
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Focused — neutral-cool-700 (#4d545a)</p>
          <app-ds-textarea label="Notes" placeholder="Focus state" [rows]="3" />
        </div>

        <div>
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Disabled — bg-surface-secondary-light, cursor not-allowed</p>
          <app-ds-textarea label="Notes" placeholder="Unavailable" [rows]="3" [disabled]="true" />
        </div>

        <div style="background:#fffbee;padding:12px;border-radius:12px;border:1px dashed #fed143;">
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Student — border-[4px] border-b-[8px] thick bottom</p>
          <div data-role="student">
            <app-ds-textarea label="My Answer" placeholder="Student theme active" [rows]="3" />
          </div>
        </div>

      </div>
    `,
  }),
};

/** LTR layout with English content. */
export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-ds-textarea
          label="Description"
          placeholder="Write a comment..."
          hintLeft="Be specific"
          hintRight="Optional"
          [showCharacterCount]="true"
          [maxLength]="300"
          [rows]="5"
        />
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:32px;">${story}</div>`,
    ),
  ],
};

/** RTL layout with Arabic placeholder and hints. */
export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-ds-textarea
          label="الوصف"
          placeholder="اكتب تعليقاً..."
          hintLeft="كن محدداً وبنّاءً"
          hintRight="اختياري"
          [showCharacterCount]="true"
          [maxLength]="300"
          [rows]="5"
        />
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:32px;">${story}</div>`,
    ),
  ],
};
