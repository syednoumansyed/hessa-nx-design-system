import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsCheckboxGroupComponent } from '@ds/checkbox-group/checkbox-group.component';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';

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
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsCheckboxGroupComponent, DsCheckboxComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsCheckboxGroupComponent>;

// ─── Basic Group ──────────────────────────────────────────────────────────────

export const Basic: Story = {
  name: 'Basic (3 options)',
  render: () => ({
    template: `
      <app-ds-checkbox-group>
        <app-ds-checkbox title="Reading" value="reading" />
        <app-ds-checkbox title="Writing" value="writing" />
        <app-ds-checkbox title="Listening" value="listening" />
      </app-ds-checkbox-group>
    `,
  }),
};

// ─── With Select All ──────────────────────────────────────────────────────────

export const WithSelectAll: Story = {
  name: 'With Select All',
  render: () => ({
    template: `
      <app-ds-checkbox-group>
        <app-ds-checkbox title="Select All" value="SELECT_ALL" />
        <app-ds-checkbox title="Math" value="math" />
        <app-ds-checkbox title="Science" value="science" />
        <app-ds-checkbox title="English" value="english" />
      </app-ds-checkbox-group>
    `,
  }),
};

// ─── Required Validation ─────────────────────────────────────────────────────

export const Required: Story = {
  name: 'Required (validation)',
  render: () => ({
    template: `
      <app-ds-checkbox-group [required]="true">
        <app-ds-checkbox title="I agree to the terms" value="agree" [required]="true" />
      </app-ds-checkbox-group>
    `,
  }),
};

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => ({
    template: `
      <app-ds-checkbox-group>
        <app-ds-checkbox title="Available" value="available" [defaultValue]="true" />
        <app-ds-checkbox title="Disabled option" value="disabled-opt" [disabled]="true" />
        <app-ds-checkbox title="Also available" value="also-available" />
      </app-ds-checkbox-group>
    `,
  }),
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
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;">${story}</div>`,
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
