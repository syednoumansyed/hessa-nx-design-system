import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, userEvent, within } from '@storybook/test';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsButtonComponent } from '@ds/button/button.component';
import { faArrowRight, faPlus, faTrash } from '@fortawesome/pro-regular-svg-icons';

/**
 * # Button — `ds-button`
 *
 * The primary action component. Used 654 times across the app — the most-used
 * component in the design system.
 *
 * **When to use:**
 * - Any user-initiated action (submit, navigate, confirm, cancel)
 * - One primary button per view for the main CTA
 *
 * **When NOT to use:**
 * - Navigation between pages → use router links
 * - Toggle states → use `ds-chip` or `ds-switch`
 * - Inline text actions → use `link` variant sparingly
 *
 * **Note:** Button text is projected via `<ng-content>` — pass it as child content,
 * not as an input property.
 *
 * **Student theme:** `border-b` is thickened to create a 3D raised effect with
 * a press-down animation on active. Activate by setting `data-role="student"` on
 * a parent element (the `StudentRole` story demonstrates this).
 */
const meta: Meta<DsButtonComponent> = {
  title: '1. P0 Components/Button',
  component: DsButtonComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    pseudo: { hover: ['ds-button'] },
    docs: {
      description: {
        component:
          'Primary action component. 7 variants × 3 sizes. Text is projected via `<ng-content>`. Has student-role tactile press effect.',
      },
    },
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'ghost', 'dangerStroke', 'dangerFill', 'link'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsButtonComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsButtonComponent>;

// ─── Variants ──────────────────────────────────────────────────────────────

export const Primary: Story = {
  render: () => ({
    template: `<ds-button variant="primary" size="lg">Confirm</ds-button>`,
  }),
};

export const Secondary: Story = {
  render: () => ({
    template: `<ds-button variant="secondary" size="lg">Cancel</ds-button>`,
  }),
};

export const Tertiary: Story = {
  render: () => ({
    template: `<ds-button variant="tertiary" size="lg">Learn More</ds-button>`,
  }),
};

export const Ghost: Story = {
  render: () => ({
    template: `<ds-button variant="ghost" size="lg">Skip</ds-button>`,
  }),
};

export const DangerStroke: Story = {
  name: 'Danger (Stroke)',
  render: () => ({
    template: `<ds-button variant="dangerStroke" size="lg">Delete</ds-button>`,
  }),
};

export const DangerFill: Story = {
  name: 'Danger (Fill)',
  render: () => ({
    template: `<ds-button variant="dangerFill" size="lg">Delete Permanently</ds-button>`,
  }),
};

export const Link: Story = {
  render: () => ({
    template: `<ds-button variant="link" size="lg">View details</ds-button>`,
  }),
};

// ─── Sizes ────────────────────────────────────────────────────────────────

export const SizeSm: Story = {
  name: 'Size: sm',
  render: () => ({
    template: `<ds-button variant="primary" size="sm">Small</ds-button>`,
  }),
};

export const SizeMd: Story = {
  name: 'Size: md',
  render: () => ({
    template: `<ds-button variant="primary" size="md">Medium</ds-button>`,
  }),
};

export const SizeLg: Story = {
  name: 'Size: lg',
  render: () => ({
    template: `<ds-button variant="primary" size="lg">Large</ds-button>`,
  }),
};

// ─── States ───────────────────────────────────────────────────────────────

export const Loading: Story = {
  render: () => ({
    template: `<ds-button variant="primary" size="lg" [loading]="true">Saving...</ds-button>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');
    await expect(btn).toBeInTheDocument();
    await expect(btn).toHaveAttribute('disabled');
  },
};

export const Disabled: Story = {
  render: () => ({
    template: `<ds-button variant="primary" size="lg" [disabled]="true">Unavailable</ds-button>`,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    template: `
      <div style="width:320px;">
        <ds-button variant="primary" size="lg" [fullWidth]="true">Submit Form</ds-button>
      </div>
    `,
  }),
};

// ─── With Icons ───────────────────────────────────────────────────────────

export const WithIconStart: Story = {
  name: 'With icon (start)',
  render: () => ({
    props: { faPlus },
    template: `<ds-button variant="primary" size="lg" [iconStart]="faPlus">Add Item</ds-button>`,
  }),
};

export const WithIconEnd: Story = {
  name: 'With icon (end)',
  render: () => ({
    props: { faArrowRight },
    template: `<ds-button variant="primary" size="lg" [iconEnd]="faArrowRight">Continue</ds-button>`,
  }),
};

// ─── All Variants Grid ────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => ({
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:12px;padding:16px;background:#f9fafb;border-radius:12px;">
        <ds-button variant="primary"      size="lg">Primary</ds-button>
        <ds-button variant="secondary"    size="lg">Secondary</ds-button>
        <ds-button variant="tertiary"     size="lg">Tertiary</ds-button>
        <ds-button variant="ghost"        size="lg">Ghost</ds-button>
        <ds-button variant="dangerStroke" size="lg">Danger Stroke</ds-button>
        <ds-button variant="dangerFill"   size="lg">Danger Fill</ds-button>
        <ds-button variant="link"         size="lg">Link</ds-button>
      </div>
    `,
  }),
};

// ─── LTR ─────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    props: { faArrowRight },
    template: `
      <div style="display:flex;gap:8px;">
        <ds-button variant="primary"   size="lg" [iconEnd]="faArrowRight">Confirm</ds-button>
        <ds-button variant="secondary" size="lg">Cancel</ds-button>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div style="display:flex;gap:8px;">
        <ds-button variant="primary"   size="lg">تأكيد</ds-button>
        <ds-button variant="secondary" size="lg">إلغاء</ds-button>
        <ds-button variant="ghost"     size="lg">تخطي</ds-button>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;">${story}</div>`,
    ),
  ],
};

// ─── Student Role ────────────────────────────────────────────────────────

export const StudentRole: Story = {
  name: 'Student Role (tactile borders)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <p style="font-size:12px;color:#6b7280;margin:0;">
          Student theme: raised 3D bottom border with press-down animation.
          Set via <code>data-role="student"</code> on a parent (applied by ThemeManagerService).
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <ds-button variant="primary"   size="lg">تأكيد / Confirm</ds-button>
          <ds-button variant="secondary" size="lg">إلغاء / Cancel</ds-button>
          <ds-button variant="primary"   size="md">Medium</ds-button>
          <ds-button variant="primary"   size="sm">Small</ds-button>
        </div>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div data-role="student" style="padding:16px;background:#fffbee;border-radius:12px;border:1px dashed #fed143;">${story}</div>`,
    ),
  ],
};
