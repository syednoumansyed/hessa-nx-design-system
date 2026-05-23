import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import { DsCheckboxGroupComponent } from '@ds/checkbox-group/checkbox-group.component';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';

/**
 * # Checkbox — `app-ds-checkbox`
 *
 * Single checkbox and checkbox group for multi-select form controls. Used 91 times.
 * Implements `ControlValueAccessor` + `NG_VALIDATORS`.
 *
 * **Inputs:**
 * - `title` — label text
 * - `defaultValue` — initial checked state (boolean)
 * - `variantInput` — `'determinate'` | `'indeterminate'` (minus icon)
 * - `size` — `'sm'` | `'lg'` (default)
 * - `disabled` — prevents interaction
 * - `required` — adds required validation
 * - `helperText` — secondary description below label
 * - `labelIcon` — FontAwesome icon rendered next to label text
 * - `labelIconPlacement` — `'start'` | `'end'` (default)
 * - `value` — value emitted to parent group (used with `DsCheckboxGroupComponent`)
 *
 * **When to use:** Multi-select options, boolean toggles in forms.
 * **When NOT to use:** Single on/off toggle → use `ds-switch`. Mutually exclusive options → use `ds-radio-group`.
 */
const meta: Meta<DsCheckboxComponent> = {
  title: '1. P0 Components/Checkbox',
  component: DsCheckboxComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    a11y: { config: { rules: [{ id: 'label', enabled: true }] } },
  },
  argTypes: {
    title: { control: 'text', description: 'Label text rendered beside the checkbox' },
    size: { control: 'select', options: ['sm', 'lg'], description: 'Visual size of the checkbox box and label' },
    variantInput: {
      control: 'select',
      options: ['determinate', 'indeterminate'],
      description: 'Indeterminate shows a minus icon instead of a checkmark',
    },
    disabled: { control: 'boolean', description: 'Prevents user interaction; grays out the control' },
    required: { control: 'boolean', description: 'Adds required validation — fails if unchecked' },
    defaultValue: { control: 'boolean', description: 'Initial checked state (not reactive after mount)' },
    helperText: { control: 'text', description: 'Secondary description rendered below the label' },
    labelIconPlacement: { control: 'select', options: ['start', 'end'] },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsCheckboxComponent, DsCheckboxGroupComponent] }),
    componentWrapperDecorator((story) => `<div style="padding:16px;">${story}</div>`),
  ],
};

export default meta;
type Story = StoryObj<DsCheckboxComponent>;

// ---------------------------------------------------------------------------
// Basic states
// ---------------------------------------------------------------------------

/** Default unchecked state — the starting point for all checkbox usage. */
export const Default: Story = {
  args: {
    title: 'Accept terms',
    size: 'lg',
  },
};

/** Pre-checked via `defaultValue`. Useful when a value is already saved. */
export const Checked: Story = {
  args: {
    title: 'Accept terms',
    size: 'lg',
    defaultValue: true,
  },
};

/**
 * Indeterminate state — shown when a parent "Select All" checkbox has only some
 * children selected. Renders a minus (`—`) icon instead of a checkmark.
 */
export const Indeterminate: Story = {
  args: {
    title: 'Select all',
    size: 'lg',
    variantInput: 'indeterminate',
  },
};

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

/** Small (`sm`) checkbox — 24 × 24 px box with `text-ds-base` label. */
export const SizeSm: Story = {
  name: 'Size: sm',
  args: {
    title: 'Compact option',
    size: 'sm',
  },
};

/** Large (`lg`) checkbox — 32 × 32 px box with `text-ds-lg` label. This is the default. */
export const SizeLg: Story = {
  name: 'Size: lg (default)',
  args: {
    title: 'Standard option',
    size: 'lg',
  },
};

// ---------------------------------------------------------------------------
// Enriched label
// ---------------------------------------------------------------------------

/**
 * Helper text appears in a lighter colour below the main label.
 * Use it to clarify consequences or add context without cluttering the label.
 */
export const WithHelperText: Story = {
  name: 'With helper text',
  args: {
    title: 'Delete account',
    size: 'lg',
    helperText: 'This action cannot be undone',
  },
};

/**
 * An icon from FontAwesome rendered adjacent to the label text.
 * `labelIconPlacement` controls whether it appears before (`start`) or after (`end`) the text.
 */
export const WithLabelIcon: Story = {
  name: 'With label icon',
  args: {
    title: 'More information',
    size: 'lg',
    labelIcon: faCircleInfo,
    labelIconPlacement: 'end',
  },
};

// ---------------------------------------------------------------------------
// Disabled states
// ---------------------------------------------------------------------------

/**
 * Both unchecked-disabled and checked-disabled side by side.
 * The cursor changes to `not-allowed` and colours are grayed out.
 */
export const Disabled: Story = {
  name: 'State: Disabled',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-checkbox title="Unavailable option (unchecked)" [disabled]="true" size="lg"></app-ds-checkbox>
        <app-ds-checkbox title="Unavailable option (checked)"   [disabled]="true" [defaultValue]="true" size="lg"></app-ds-checkbox>
      </div>
    `,
  }),
};

/** Disabled + pre-checked. The checkmark is visible but interaction is blocked. */
export const DisabledChecked: Story = {
  name: 'State: Disabled + checked',
  args: {
    title: 'Pre-selected, read-only',
    size: 'lg',
    disabled: true,
    defaultValue: true,
  },
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Required checkbox — the form control is invalid until the user checks it.
 * Wire this inside a `ReactiveFormsModule` form to surface the error state.
 */
export const Required: Story = {
  name: 'Validation: required',
  args: {
    title: 'I have read and agree to the privacy policy',
    size: 'lg',
    required: true,
  },
};

// ---------------------------------------------------------------------------
// Checkbox Group
// ---------------------------------------------------------------------------

/**
 * `DsCheckboxGroupComponent` wraps multiple checkboxes and manages their collective state.
 *
 * - The child with `[value]="'SELECT_ALL'"` acts as a "Select All" toggle.
 * - When some (but not all) children are checked, SELECT_ALL automatically switches to **indeterminate**.
 * - The group emits an array of the selected non-SELECT_ALL values via `ControlValueAccessor`.
 */
export const CheckboxGroup: Story = {
  name: 'Checkbox Group (with Select All)',
  render: () => ({
    template: `
      <app-ds-checkbox-group style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-checkbox title="Select All" value="SELECT_ALL" size="lg"></app-ds-checkbox>
        <div style="padding-inline-start:24px;display:flex;flex-direction:column;gap:8px;">
          <app-ds-checkbox title="Mathematics"    value="math"    size="lg"></app-ds-checkbox>
          <app-ds-checkbox title="Science"        value="science" size="lg"></app-ds-checkbox>
          <app-ds-checkbox title="Arabic Language" value="arabic" size="lg"></app-ds-checkbox>
        </div>
      </app-ds-checkbox-group>
    `,
  }),
};

// ---------------------------------------------------------------------------
// LTR / RTL
// ---------------------------------------------------------------------------

/** Left-to-right layout — English labels, `Nunito` font. */
export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <app-ds-checkbox title="Accept terms" size="lg"></app-ds-checkbox>
        <app-ds-checkbox title="Subscribe to updates" size="lg" [defaultValue]="true"></app-ds-checkbox>
        <app-ds-checkbox title="Remember me" size="lg" helperText="You will be signed in automatically"></app-ds-checkbox>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};

/** Right-to-left layout — Arabic labels, `Lama Rounded` font. */
export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <app-ds-checkbox title="أوافق على الشروط" size="lg"></app-ds-checkbox>
        <app-ds-checkbox title="الاشتراك في التحديثات" size="lg" [defaultValue]="true"></app-ds-checkbox>
        <app-ds-checkbox title="تذكرني" size="lg" helperText="سيتم تسجيل دخولك تلقائياً"></app-ds-checkbox>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};
