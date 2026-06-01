import { expect, userEvent, within } from 'storybook/test';
import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsInputComponent } from '@ds/input/input.component';
import {
  faSearch,
  faEye,
  faEnvelope,
  faLock,
  faEyeSlash,
  faPhone,
} from '@fortawesome/pro-regular-svg-icons';

/**
 * # Input — `app-ds-input`
 *
 * The primary text input component. Implements `ControlValueAccessor` for full
 * Angular Reactive Forms integration. Used 83+ times across the app.
 *
 * **When to use:**
 * - Any free-text data entry (name, email, phone, number)
 * - With `[formControl]` or `formControlName` for form validation
 * - Standalone with `(valueChanged)` for non-form usage
 *
 * **Student theme:** `border-[4px] border-b-[8px]` — thick bottom-heavy border
 * creates a tactile "input tray" look. Activate via `data-role="student"` on parent.
 *
 * **Responsive tokens:** `--ds-spacing-*` for padding, `--font-size-base` for text.
 *
 * **Direct value binding (no form):** Use the `inputValue` signal input for
 * Storybook/non-form scenarios — no `FormControl` required.
 */
const meta: Meta<DsInputComponent> = {
  title: '1. P0 Components/Input',
  component: DsInputComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    pseudo: { hover: ['app-ds-input'], focus: ['app-ds-input'] },
    docs: {
      description: {
        component:
          'Text input with full form integration. 27+ input properties covering label, hint, error, icons, types, prefix, character count, and more. Uses Angular signal inputs throughout.',
      },
    },
    a11y: { config: { rules: [{ id: 'label', enabled: true }] } },
  },
  argTypes: {
    label: { control: 'text', description: 'Floating label above the input' },
    placeholder: { control: 'text' },
    hint: { control: 'text', description: 'Helper text shown below the input' },
    errorMessage: {
      control: 'text',
      description: 'Red error message; also triggers error border',
    },
    dsType: {
      control: 'select',
      options: ['text', 'number', 'tel', 'email'],
      description: 'HTML input type',
    },
    disabled: { control: 'boolean' },
    loading: {
      control: 'boolean',
      description: 'Shows spinner inside the field',
    },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    showCharacterCount: { control: 'boolean' },
    maxLength: { control: 'number' },
    prefix: { control: 'text' },
    showPrefix: { control: 'boolean' },
    inputValue: {
      control: 'text',
      description: 'Direct value binding (no form control needed)',
    },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({ imports: [DsInputComponent, ReactiveFormsModule] }),
    componentWrapperDecorator(
      (story) => `<div style="max-width:360px;padding:16px;">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsInputComponent>;

// ─── Default ────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default (placeholder only)',
  parameters: {
    docs: {
      description: {
        story: 'Bare input with placeholder and no label — the minimal config.',
      },
    },
  },
  args: {
    placeholder: 'Enter text…',
  },
};

// ─── With Label ─────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  name: 'With label',
  parameters: {
    docs: {
      description: { story: 'Label + placeholder — the typical usage pattern.' },
    },
  },
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
  },
};

// ─── With Hint ──────────────────────────────────────────────────────────────

export const WithHint: Story = {
  name: 'With hint text',
  parameters: {
    docs: {
      description: {
        story:
          'Hint text appears below the input to guide the user. Hidden when an error is shown.',
      },
    },
  },
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
    hint: 'As it appears on your national ID',
  },
};

// ─── Error State ─────────────────────────────────────────────────────────────

export const ErrorState: Story = {
  name: 'State: Error',
  parameters: {
    docs: {
      description: {
        story:
          '`errorMessage` triggers the red border and danger-subtle background. Replaces the hint text.',
      },
    },
  },
  args: {
    label: 'Email address',
    placeholder: 'name@school.edu.sa',
    dsType: 'email',
    inputValue: 'not-an-email',
    errorMessage: 'Please enter a valid email address',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const errorMsg = await canvas.findByText('Please enter a valid email address');
    await expect(errorMsg).toBeInTheDocument();
  },
};

// ─── Read Only ───────────────────────────────────────────────────────────────

export const ReadOnly: Story = {
  name: 'State: Read Only',
  parameters: {
    docs: {
      description: {
        story:
          '`readOnly=true` prevents editing. Value is shown via `inputValue` signal input — no form needed.',
      },
    },
  },
  args: {
    label: 'Student ID',
    inputValue: 'STU-20240001',
    readOnly: true,
  },
};

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  name: 'State: Disabled',
  parameters: {
    docs: {
      description: {
        story:
          '`disabled=true` sets `bg-surface-secondary-light` and muted text. The CDK platform also prevents interaction.',
      },
    },
  },
  args: {
    label: 'School name',
    placeholder: 'Unavailable',
    disabled: true,
  },
};

// ─── Loading ─────────────────────────────────────────────────────────────────

export const Loading: Story = {
  name: 'State: Loading',
  parameters: {
    docs: {
      description: {
        story:
          '`loading=true` renders an `IonSpinner` inside the field — useful while async validation or lookup is in progress.',
      },
    },
  },
  args: {
    label: 'Username',
    placeholder: 'Checking availability…',
    inputValue: 'ahmed.ali',
    loading: true,
  },
};

// ─── With Icon Start ─────────────────────────────────────────────────────────

export const WithIconStart: Story = {
  name: 'With icon (start)',
  parameters: {
    docs: {
      description: {
        story:
          '`iconStart` accepts any `DsIcon` (FontAwesome icon object). Adds 46px start padding to the text area.',
      },
    },
  },
  args: {
    label: 'Search',
    placeholder: 'Search students…',
    iconStart: faSearch,
  },
};

// ─── With Icon End ───────────────────────────────────────────────────────────

export const WithIconEnd: Story = {
  name: 'With icon (end)',
  parameters: {
    docs: {
      description: {
        story:
          '`iconEnd` renders a clickable icon on the trailing edge. `(iconEndClick)` fires on press — typically used for password visibility toggle.',
      },
    },
  },
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    iconEnd: faEye,
  },
};

// ─── With Prefix ─────────────────────────────────────────────────────────────

export const WithPrefix: Story = {
  name: 'With prefix',
  parameters: {
    docs: {
      description: {
        story:
          '`prefix` shows a short text badge (e.g. country code) at the start. `showPrefix=true` is the default.',
      },
    },
  },
  args: {
    label: 'Phone number',
    placeholder: '5XXXXXXXX',
    prefix: '+966',
    showPrefix: true,
    dsType: 'tel',
  },
};

// ─── Character Count ─────────────────────────────────────────────────────────

export const CharacterCount: Story = {
  name: 'With character count',
  parameters: {
    docs: {
      description: {
        story:
          '`showCharacterCount=true` + `maxLength` renders a `current/max` counter below the input. Android maxLength is enforced programmatically.',
      },
    },
  },
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself',
    hint: 'Brief description shown on your profile',
    showCharacterCount: true,
    maxLength: 100,
  },
};

// ─── Type: Email ─────────────────────────────────────────────────────────────

export const TypeEmail: Story = {
  name: 'Type: email',
  parameters: {
    docs: {
      description: {
        story: '`dsType="email"` triggers the email keyboard on mobile.',
      },
    },
  },
  args: {
    label: 'Email address',
    placeholder: 'name@school.edu.sa',
    dsType: 'email',
    iconStart: faEnvelope,
  },
};

// ─── Type: Tel ───────────────────────────────────────────────────────────────

export const TypeTel: Story = {
  name: 'Type: tel',
  parameters: {
    docs: {
      description: { story: '`dsType="tel"` triggers the numeric dial pad on mobile.' },
    },
  },
  args: {
    label: 'Mobile number',
    placeholder: '05XXXXXXXX',
    dsType: 'tel',
    prefix: '+966',
    showPrefix: true,
  },
};

// ─── Type: Number ────────────────────────────────────────────────────────────

export const TypeNumber: Story = {
  name: 'Type: number',
  parameters: {
    docs: {
      description: { story: '`dsType="number"` shows the numeric keyboard on mobile.' },
    },
  },
  args: {
    label: 'Grade score',
    placeholder: '0–100',
    dsType: 'number',
    maxLength: 3,
  },
};

// ─── Required ────────────────────────────────────────────────────────────────

export const Required: Story = {
  name: 'Required field',
  parameters: {
    docs: {
      description: {
        story:
          '`required=true` shows the required indicator on the label. Can also be derived automatically from a `Validators.required` form control.',
      },
    },
  },
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
    required: true,
    hint: 'This field is mandatory',
  },
};

// ─── Student Role ─────────────────────────────────────────────────────────────

export const StudentRole: Story = {
  name: 'Student Role (tactile borders)',
  parameters: {
    docs: {
      description: {
        story:
          '`data-role="student"` on a parent element activates the student theme: `border-[4px] border-b-[8px]` for a thick bottom-heavy border that creates a tactile "input tray" feel for younger users.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">
          Student theme — thick bottom border via <code>data-role="student"</code> on ancestor.
        </p>
        <app-ds-input label="Full name" placeholder="Enter your name" hint="Required field"></app-ds-input>
        <app-ds-input label="Email" placeholder="student@school.edu.sa" dsType="email"></app-ds-input>
        <app-ds-input label="Grade score" placeholder="0–100" dsType="number" maxLength="3"></app-ds-input>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div data-role="student" style="max-width:360px;padding:16px;background:#fffbee;border-radius:12px;border:1px dashed #fed143;">${story}</div>`,
    ),
  ],
};

// ─── Password ────────────────────────────────────────────────────────────────

export const Password: Story = {
  name: 'Type: password',
  parameters: {
    docs: {
      description: {
        story:
          '`inputMode="password"` sets the native `type="password"`, masking the text. Pair with `iconEnd` for a show/hide toggle.',
      },
    },
  },
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    inputMode: 'password',
    iconEnd: faEye,
  },
};

// ─── Both Icons ───────────────────────────────────────────────────────────────

export const BothIcons: Story = {
  name: 'With both icons',
  parameters: {
    docs: {
      description: {
        story:
          '`iconStart` (with divider stroke) + `iconEnd` simultaneously. The start icon sits behind a `border-e border-stroke-mid` separator; the end icon is absolutely positioned on the trailing edge.',
      },
    },
  },
  args: {
    label: 'Email address',
    placeholder: 'name@school.edu.sa',
    dsType: 'email',
    iconStart: faEnvelope,
    iconEnd: faSearch,
  },
};

// ─── All Stroke States ────────────────────────────────────────────────────────

export const AllStrokeStates: Story = {
  name: 'All stroke states',
  parameters: {
    docs: {
      description: {
        story: `
Visual reference for all input border/stroke states. Hover and focus borders are forced via \`outerContainerClass\` so they render without user interaction.

| State | Token | Hex | Condition |
|---|---|---|---|
| **Default** | \`neutral-cool-100\` | \`#e5e6e7\` | Idle |
| **Hover** | \`neutral-cool-200\` | \`#ccced0\` | \`:hover\` |
| **Focused** | \`neutral-cool-700\` | \`#4d545a\` | \`:focus-within\` |
| **Error** | \`--colors-error-red-400\` | red | \`errorMessage\` set |
| **Disabled** | \`neutral-cool-100\` | \`#e5e6e7\` | \`disabled=true\` |

**Student theme** adds \`border-[4px] border-b-[8px]\` (thick bottom) on top of any state.
        `,
      },
    },
  },
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:20px;max-width:360px;">

        <div>
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Default — neutral-cool-100 (#e5e6e7)</p>
          <app-ds-input label="Full name" placeholder="Idle state"></app-ds-input>
        </div>

        <div>
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Hover — neutral-cool-200 (#ccced0)</p>
          <app-ds-input label="Full name" placeholder="Hover state" outerContainerClass="!border-neutral-cool-200"></app-ds-input>
        </div>

        <div>
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Focused — neutral-cool-700 (#4d545a)</p>
          <app-ds-input label="Full name" placeholder="Focus state" outerContainerClass="!border-neutral-cool-700"></app-ds-input>
        </div>

        <div>
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Error — border-error + bg-surface-danger-subtle</p>
          <app-ds-input label="Email address" placeholder="name@school.edu.sa" inputValue="not-an-email" errorMessage="Please enter a valid email address"></app-ds-input>
        </div>

        <div>
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Read Only — interaction blocked, no bg change</p>
          <app-ds-input label="Student ID" inputValue="STU-20240001" [readOnly]="true"></app-ds-input>
        </div>

        <div>
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Disabled — bg-surface-secondary-light, text-content-low</p>
          <app-ds-input label="School name" placeholder="Unavailable" [disabled]="true"></app-ds-input>
        </div>

        <div style="background:#fffbee;padding:12px;border-radius:12px;border:1px dashed #fed143;">
          <p style="font-size:11px;font-weight:600;color:#9ca3af;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Student — border-[4px] border-b-[8px] thick bottom</p>
          <div data-role="student">
            <app-ds-input label="Full name" placeholder="Student theme active"></app-ds-input>
          </div>
        </div>

      </div>
    `,
  }),
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  parameters: {
    docs: {
      description: {
        story:
          'Left-to-right layout with English font. The Storybook global decorator sets `dir` on `<body>` — this wrapper overrides for documentation purposes.',
      },
    },
  },
  args: {
    label: 'Full name',
    placeholder: 'Enter your full name',
    hint: 'Required field',
    required: true,
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;max-width:360px;padding:16px;">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  parameters: {
    docs: {
      description: {
        story:
          'Right-to-left layout with Arabic placeholder text. Icons, prefix, and hint all mirror correctly. Lama Rounded font applied.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-input label="الاسم الكامل" placeholder="أدخل اسمك الكامل" hint="كما يظهر في الهوية" [required]="true"></app-ds-input>
        <app-ds-input label="البريد الإلكتروني" placeholder="name@school.edu.sa" dsType="email"></app-ds-input>
        <app-ds-input label="رقم الجوال" placeholder="05XXXXXXXX" dsType="tel" prefix="+966" [showPrefix]="true"></app-ds-input>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;max-width:360px;padding:16px;">${story}</div>`,
    ),
  ],
};

