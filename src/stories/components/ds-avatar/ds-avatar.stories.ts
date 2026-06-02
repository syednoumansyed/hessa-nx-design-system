import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { UserProfileColors } from '@shared/enums';

/**
 * # Avatar - `app-ds-avatar`
 *
 * Displays a user photo when available, otherwise a generated first-letter
 * initial with a token-backed profile color.
 */
const meta: Meta<AvatarComponent> = {
  title: '1. P0 Components/Avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'User avatar with local image support and initials fallback. Supports 8 sizes, profile-color tokens, and optional border.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
    color: {
      control: 'select',
      options: Object.values(UserProfileColors),
    },
    includeBorder: { control: 'boolean' },
    imageUrl: { control: 'text' },
    fullName: { control: 'text' },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({ imports: [AvatarComponent] }),
    componentWrapperDecorator((story) => `<div class="p-ds-xl">${story}</div>`),
  ],
};

export default meta;
type Story = StoryObj<AvatarComponent>;

export const Default: Story = {
  args: {
    fullName: 'Ahmed Al-Rashid',
    size: 'md',
    includeBorder: true,
    color: UserProfileColors.NEUTRAL,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('A')).toBeInTheDocument();
  },
};

export const WithImage: Story = {
  args: {
    fullName: 'Sara Al-Mansouri',
    imageUrl: 'assets/icons/avatar-bg.png',
    size: '2xl',
    includeBorder: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByAltText('Sara Al-Mansouri'),
    ).toBeInTheDocument();
  },
};

export const WithoutBorder: Story = {
  args: {
    fullName: 'Khaled Nasser',
    size: 'lg',
    includeBorder: false,
    color: UserProfileColors.BRAND,
  },
};

export const AllSizes: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-end gap-ds-xl">
        @for (size of sizes; track size) {
          <div class="flex flex-col items-center gap-ds-sm">
            <app-ds-avatar
              fullName="Ahmed Al-Rashid"
              [size]="size"
              [includeBorder]="true"
            />
            <span class="single-line-caption-mid-emphasis text-content-mid">
              {{ size }}
            </span>
          </div>
        }
      </div>
    `,
    props: {
      sizes: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
  }),
};

export const AllColors: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-end gap-ds-lg">
        @for (item of items; track item.color) {
          <div class="flex flex-col items-center gap-ds-sm">
            <app-ds-avatar
              [fullName]="item.label"
              size="2xl"
              [color]="item.color"
              [includeBorder]="false"
            />
            <span class="single-line-caption-mid-emphasis text-content-mid">
              {{ item.color }}
            </span>
          </div>
        }
      </div>
    `,
    props: {
      items: [
        { label: 'Brand', color: UserProfileColors.BRAND },
        { label: 'Emerald', color: UserProfileColors.EMERALD },
        { label: 'Blue', color: UserProfileColors.BLUE },
        { label: 'Green', color: UserProfileColors.GREEN },
        { label: 'Yellow', color: UserProfileColors.YELLOW },
        { label: 'Neutral', color: UserProfileColors.NEUTRAL },
        { label: 'Coral', color: UserProfileColors.CORAL },
        { label: 'Teal', color: UserProfileColors.TEAL },
        { label: 'Purple', color: UserProfileColors.PURPLE },
        { label: 'Indigo', color: UserProfileColors.INDIGO },
      ],
    },
  }),
};

export const Initials: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-end gap-ds-xl">
        @for (name of names; track name) {
          <div class="flex flex-col items-center gap-ds-sm">
            <app-ds-avatar
              [fullName]="name"
              size="2xl"
              color="teal"
              [includeBorder]="true"
            />
            <span class="content-sm-default text-content-mid">
              {{ name }}
            </span>
          </div>
        }
      </div>
    `,
    props: {
      names: ['Layla', 'Sara Johnson', 'Mohammed Al Hassan Al Rashid'],
    },
  }),
};

export const EmptyNameFallback: Story = {
  name: 'Empty name fallback',
  args: {
    fullName: ' ',
    size: 'lg',
    includeBorder: true,
    color: UserProfileColors.NEUTRAL,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The production component renders an empty initial when `fullName` is blank, so consumers should pass a real display name.',
      },
    },
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div dir="ltr" lang="en">
        <app-ds-avatar
          fullName="John Smith"
          size="lg"
          color="blue"
          [includeBorder]="true"
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
        <app-ds-avatar
          fullName="أحمد الراشد"
          size="lg"
          color="brand"
          [includeBorder]="true"
        />
      </div>
    `,
  }),
  decorators: [withHessaProviders({ locale: 'ar' })],
};
