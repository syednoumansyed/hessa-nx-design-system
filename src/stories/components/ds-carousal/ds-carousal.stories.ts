import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import {
  CarousalComponent,
  DsCarouselSlide,
} from '@ds/carousal/carousal.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

/**
 * # Carousel — `ds-carousal`
 *
 * A swipeable slider component used for viewing multiple slides or content blocks
 * in a carousel. Supports drag gesture control on touch/desktop and visual indicators.
 */
const meta: Meta<CarousalComponent> = {
  title: '1. P0 Components/Carousel',
  component: CarousalComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({ ionic: true }),
    moduleMetadata({
      imports: [CarousalComponent, DsIconComponent],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="p-ds-lg max-w-[480px] bg-surface-primary">${story}</div>`,
    ),
  ],
  argTypes: {
    slides: {
      control: 'object',
      description: 'List of slide items to render.',
    },
    activeIndex: {
      control: 'number',
      description: 'Current active index of the carousel.',
    },
    isContentLoading: {
      control: 'boolean',
      description: 'Controls content loading skeleton overlays.',
    },
  },
};

export default meta;
type Story = StoryObj<CarousalComponent>;

const sampleSlides: DsCarouselSlide[] = [
  {
    id: 1,
    boldTitle: 'Step 1',
    regularTitle: 'Setup your account',
    isHighlighted: true,
  },
  {
    id: 2,
    boldTitle: 'Step 2',
    regularTitle: 'Configure preferences',
    isHighlighted: false,
  },
  {
    id: 3,
    boldTitle: 'Step 3',
    regularTitle: 'Invite your students',
    isHighlighted: false,
  },
];

// ─── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {
  name: 'Default',
  args: {
    slides: sampleSlides,
    activeIndex: 0,
    isContentLoading: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-carousal
        [slides]="slides"
        [(activeIndex)]="activeIndex"
        [isContentLoading]="isContentLoading"
      >
        <div class="h-32 flex items-center justify-center bg-surface-secondary-light rounded-xl mt-4">
          <p class="content-md-default text-content-high">Slide Content #{{ activeIndex + 1 }}</p>
        </div>
      </ds-carousal>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Locate the next arrow (second cursor-pointer element)
    const nextBtn = canvasElement.querySelectorAll(
      '.cursor-pointer',
    )[1] as HTMLElement;
    await expect(nextBtn).toBeInTheDocument();

    // Click next slide button
    await userEvent.click(nextBtn);

    // Verify slide index matches
    const activeText = canvas.getByText('Slide Content #2');
    await expect(activeText).toBeInTheDocument();
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────
export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    slides: sampleSlides,
    activeIndex: 0,
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-carousal [slides]="slides" [(activeIndex)]="activeIndex">
        <div class="h-32 flex items-center justify-center bg-surface-secondary-light rounded-xl mt-4">
          <p class="content-md-default text-content-high">Slide Content #{{ activeIndex + 1 }}</p>
        </div>
      </ds-carousal>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────
export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    slides: [
      {
        id: 1,
        boldTitle: 'الخطوة ١',
        regularTitle: 'إعداد الحساب',
        isHighlighted: true,
      },
      {
        id: 2,
        boldTitle: 'الخطوة ٢',
        regularTitle: 'تكوين التفضيلات',
        isHighlighted: false,
      },
      {
        id: 3,
        boldTitle: 'الخطوة ٣',
        regularTitle: 'دعوة الطلاب',
        isHighlighted: false,
      },
    ],
    activeIndex: 0,
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-carousal [slides]="slides" [(activeIndex)]="activeIndex">
        <div class="h-32 flex items-center justify-center bg-surface-secondary-light rounded-xl mt-4">
          <p class="content-md-default text-content-high">محتوى الشريحة رقم {{ activeIndex + 1 }}</p>
        </div>
      </ds-carousal>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
