import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsProgressBarComponent } from '@ds/progress-bar/progress-bar.component';

/**
 * # Progress Bar - `app-ds-progress-bar`
 *
 * Animated horizontal progress indicator for completion percentages. The
 * component clamps values to 0-100 and eases the rendered width internally.
 *
 * **When to use:** attendance, course progress, assignment completion, score
 * summaries, and compact list-row progress.
 */
const meta: Meta<DsProgressBarComponent> = {
  title: '1. P0 Components/Progress Bar',
  component: DsProgressBarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Animated progress bar. Supports 7 semantic variants, sm/lg track sizes, optional percentage labels, and RTL-aware label alignment.',
      },
    },
  },
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    variant: {
      control: 'select',
      options: [
        'green',
        'red',
        'blue',
        'yellow',
        'indigo',
        'orange',
        'neon-green',
      ],
    },
    size: { control: 'select', options: ['sm', 'lg'] },
    showPercentage: { control: 'boolean' },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({ imports: [DsProgressBarComponent] }),
    componentWrapperDecorator(
      (story) => `<div class="w-[400px] max-w-full p-ds-xl">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsProgressBarComponent>;

export const Default: Story = {
  args: {
    progress: 65,
    variant: 'green',
    size: 'lg',
    showPercentage: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('65%')).toBeInTheDocument();
  },
};

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-ds-xl">
        @for (item of items; track item.variant) {
          <div class="flex flex-col gap-ds-sm">
            <span class="single-line-caption-mid-emphasis text-content-mid">
              {{ item.label }}
            </span>
            <app-ds-progress-bar
              [progress]="item.progress"
              [variant]="item.variant"
              size="lg"
              [showPercentage]="true"
            />
          </div>
        }
      </div>
    `,
    props: {
      items: [
        { label: 'Complete', variant: 'green', progress: 92 },
        { label: 'Needs attention', variant: 'red', progress: 24 },
        { label: 'In progress', variant: 'blue', progress: 58 },
        { label: 'Pending review', variant: 'yellow', progress: 42 },
        { label: 'Learning path', variant: 'indigo', progress: 76 },
        { label: 'Assignments', variant: 'orange', progress: 64 },
        { label: 'Growth', variant: 'neon-green', progress: 88 },
      ],
    },
  }),
};

export const SizeSm: Story = {
  name: 'Size: sm',
  args: {
    progress: 45,
    variant: 'blue',
    size: 'sm',
    showPercentage: true,
  },
};

export const SizeLg: Story = {
  name: 'Size: lg',
  args: {
    progress: 45,
    variant: 'blue',
    size: 'lg',
    showPercentage: true,
  },
};

export const HidePercentage: Story = {
  args: {
    progress: 78,
    variant: 'green',
    size: 'lg',
    showPercentage: false,
  },
};

export const ZeroProgress: Story = {
  args: {
    progress: 0,
    variant: 'red',
    size: 'lg',
    showPercentage: true,
  },
};

export const FullProgress: Story = {
  args: {
    progress: 100,
    variant: 'green',
    size: 'lg',
    showPercentage: true,
  },
};

export const ClampedProgress: Story = {
  name: 'Clamped progress',
  args: {
    progress: 140,
    variant: 'orange',
    size: 'lg',
    showPercentage: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The production component clamps values above 100 before animating.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('100%')).toBeInTheDocument();
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div dir="ltr" lang="en">
        <app-ds-progress-bar
          [progress]="72"
          variant="green"
          size="lg"
          [showPercentage]="true"
        />
      </div>
    `,
  }),
  decorators: [withHessaProviders({ locale: 'en' })],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div dir="rtl" lang="ar">
        <app-ds-progress-bar
          [progress]="72"
          variant="green"
          size="lg"
          [showPercentage]="true"
        />
      </div>
    `,
  }),
  decorators: [withHessaProviders({ locale: 'ar' })],
};
