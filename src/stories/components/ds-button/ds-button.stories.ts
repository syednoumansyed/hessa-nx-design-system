import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  faArrowRight,
  faPlus,
  faTrash,
} from '@fortawesome/pro-regular-svg-icons';

/**
 * # Button - `ds-button`
 *
 * The primary action component. Text is projected through `ng-content`; icons,
 * loading, disabled state, size, width, and variant are production inputs.
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
          'Action button with 7 variants, 3 sizes, icon slots, loading state, full-width mode, and student-role tactile borders.',
      },
    },
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'tertiary',
        'ghost',
        'dangerStroke',
        'dangerFill',
        'link',
      ],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    title: { control: 'text' },
    cssClass: { control: 'text' },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({ imports: [DsButtonComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsButtonComponent>;

export const Default: Story = {
  render: () => ({
    template: `<ds-button variant="primary" size="lg">Confirm</ds-button>`,
  }),
};

export const Primary: Story = Default;

export const Secondary: Story = {
  render: () => ({
    template: `<ds-button variant="secondary" size="lg">Cancel</ds-button>`,
  }),
};

export const Tertiary: Story = {
  render: () => ({
    template: `<ds-button variant="tertiary" size="lg">Learn more</ds-button>`,
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
    template: `<ds-button variant="dangerFill" size="lg">Delete permanently</ds-button>`,
  }),
};

export const Error: Story = {
  name: 'Error / destructive',
  render: () => ({
    props: { faTrash },
    template: `
      <ds-button
        variant="dangerFill"
        size="lg"
        [iconStart]="faTrash"
      >
        Remove student
      </ds-button>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Matrix destructive state using the production `dangerFill` variant and icon slot.',
      },
    },
  },
};

export const Link: Story = {
  render: () => ({
    template: `<ds-button variant="link" size="lg">View details</ds-button>`,
  }),
};

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

export const Loading: Story = {
  render: () => ({
    template: `
      <ds-button variant="primary" size="lg" [loading]="true">
        Saving
      </ds-button>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button')).toHaveAttribute('disabled');
  },
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <ds-button variant="primary" size="lg" [disabled]="true">
        Unavailable
      </ds-button>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button')).toBeDisabled();
  },
};

export const FullWidth: Story = {
  render: () => ({
    template: `
      <div class="w-[320px]">
        <ds-button variant="primary" size="lg" [fullWidth]="true">
          Submit form
        </ds-button>
      </div>
    `,
  }),
};

export const SubmitType: Story = {
  name: 'Type: submit',
  render: () => ({
    template: `
      <form class="flex flex-col gap-ds-md">
        <ds-button type="submit" variant="primary" size="lg">
          Submit
        </ds-button>
      </form>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button')).toHaveAttribute('type', 'submit');
  },
};

export const WithIconStart: Story = {
  name: 'With icon (start)',
  render: () => ({
    props: { faPlus },
    template: `
      <ds-button variant="primary" size="lg" [iconStart]="faPlus">
        Add item
      </ds-button>
    `,
  }),
};

export const WithIconEnd: Story = {
  name: 'With icon (end)',
  render: () => ({
    props: { faArrowRight },
    template: `
      <ds-button variant="primary" size="lg" [iconEnd]="faArrowRight">
        Continue
      </ds-button>
    `,
  }),
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-ds-md bg-surface-secondary-light p-ds-xl">
        <ds-button variant="primary" size="lg">Primary</ds-button>
        <ds-button variant="secondary" size="lg">Secondary</ds-button>
        <ds-button variant="tertiary" size="lg">Tertiary</ds-button>
        <ds-button variant="ghost" size="lg">Ghost</ds-button>
        <ds-button variant="dangerStroke" size="lg">Danger Stroke</ds-button>
        <ds-button variant="dangerFill" size="lg">Danger Fill</ds-button>
        <ds-button variant="link" size="lg">Link</ds-button>
      </div>
    `,
  }),
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    props: { faArrowRight },
    template: `
      <div class="flex gap-ds-sm" lang="en" dir="ltr">
        <ds-button variant="primary" size="lg" [iconEnd]="faArrowRight">
          Confirm
        </ds-button>
        <ds-button variant="secondary" size="lg">Cancel</ds-button>
      </div>
    `,
  }),
  decorators: [withHessaProviders({ locale: 'en' })],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div class="flex gap-ds-sm" lang="ar" dir="rtl">
        <ds-button variant="primary" size="lg">تأكيد</ds-button>
        <ds-button variant="secondary" size="lg">إلغاء</ds-button>
        <ds-button variant="ghost" size="lg">تخطي</ds-button>
      </div>
    `,
  }),
  decorators: [withHessaProviders({ locale: 'ar' })],
};

export const StudentRole: Story = {
  name: 'Student Role (tactile borders)',
  render: () => ({
    template: `
      <div class="flex flex-col gap-ds-lg" data-role="student">
        <div class="flex flex-wrap gap-ds-md">
          <ds-button variant="primary" size="lg">Confirm</ds-button>
          <ds-button variant="secondary" size="lg">Cancel</ds-button>
          <ds-button variant="primary" size="md">Medium</ds-button>
          <ds-button variant="primary" size="sm">Small</ds-button>
        </div>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div class="bg-pastels-brand-50 p-ds-xl" data-role="student">${story}</div>`,
    ),
  ],
};
