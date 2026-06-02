import { Component, Input } from '@angular/core';
import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsJournalFeedComponent } from '@ds/journal-feed/journal-feed.component';
import { JournalCardData } from '@ds-layout/services/student-journals.interface';
import { JournalType, UserProfileColors } from '@shared/enums';

@Component({
  selector: 'story-journal-feed-harness',
  standalone: true,
  imports: [DsJournalFeedComponent],
  template: `
    <div class="flex flex-col gap-ds-md">
      <ds-journal-feed
        [weeklyJournals]="weeklyJournals"
        [dailyJournals]="dailyJournals"
        [allJournals]="allJournals"
        [showNewChip]="showNewChip"
        (journalClicked)="clicked = $event.displayName"
      />
      <p class="content-sm-default text-content-mid">
        Clicked: {{ clicked || 'none' }}
      </p>
    </div>
  `,
})
class StoryJournalFeedHarnessComponent {
  @Input() weeklyJournals: JournalCardData[] = [];
  @Input() dailyJournals: JournalCardData[] = [];
  @Input() allJournals: JournalCardData[] = [];
  @Input() showNewChip = false;

  clicked = '';
}

const now = new Date().toISOString();

const weeklyJournals: JournalCardData[] = [
  {
    id: 1,
    displayName: 'Ahmed Al-Rashid',
    avatar: null,
    studentId: 101,
    updatedAt: now,
    type: JournalType.WEEKLY,
    viewed: false,
    viewedByGuardian: false,
    profileColor: UserProfileColors.BRAND,
  },
  {
    id: 2,
    displayName: 'Sara Al-Mansouri',
    avatar: null,
    studentId: 102,
    updatedAt: now,
    type: JournalType.WEEKLY,
    viewed: true,
    viewedByGuardian: true,
    profileColor: UserProfileColors.EMERALD,
  },
];

const dailyJournals: JournalCardData[] = [
  {
    id: 3,
    displayName: 'Omar Abdullah',
    avatar: null,
    studentId: 103,
    updatedAt: now,
    type: JournalType.DAILY,
    viewed: false,
    viewedByGuardian: false,
    profileColor: UserProfileColors.BLUE,
  },
];

const allJournals = [...weeklyJournals, ...dailyJournals];

/**
 * # Journal Feed
 *
 * Responsive journal summary list. Desktop renders grouped weekly/daily rows;
 * mobile renders horizontal cards from `allJournals`.
 */
const meta: Meta<DsJournalFeedComponent> = {
  title: '2. P1 Components/Journal Feed',
  component: DsJournalFeedComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Journal feed with desktop grouped rows and mobile horizontal cards. Uses LayoutService to choose the production branch.',
      },
    },
  },
  argTypes: {
    weeklyJournals: { control: 'object' },
    dailyJournals: { control: 'object' },
    allJournals: { control: 'object' },
    showNewChip: { control: 'boolean' },
  },
  decorators: [
    withHessaProviders({ layout: true, mobile: false }),
    moduleMetadata({
      imports: [DsJournalFeedComponent, StoryJournalFeedHarnessComponent],
    }),
    componentWrapperDecorator(
      (story) => `<div class="w-[520px] max-w-full p-ds-xl">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsJournalFeedComponent>;

const renderHarness = () => ({
  props: {
    weeklyJournals,
    dailyJournals,
    allJournals,
    showNewChip: true,
  },
  template: `
    <story-journal-feed-harness
      [weeklyJournals]="weeklyJournals"
      [dailyJournals]="dailyJournals"
      [allJournals]="allJournals"
      [showNewChip]="showNewChip"
    />
  `,
});

export const Default: Story = {
  render: renderHarness,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText(/Ahmed Al-Rashid/));
    await expect(
      await canvas.findByText('Clicked: Ahmed Al-Rashid'),
    ).toBeInTheDocument();
  },
};

export const Mobile: Story = {
  render: renderHarness,
  decorators: [
    withHessaProviders({ layout: true, mobile: true }),
    componentWrapperDecorator(
      (story) => `<div class="w-[390px] max-w-full p-ds-md">${story}</div>`,
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/Ahmed Al-Rashid/)).toBeInTheDocument();
  },
};

export const ReadOnlyEmptyState: Story = {
  name: 'Read-only empty state',
  render: () => ({
    props: {
      weeklyJournals: [],
      dailyJournals: [],
      allJournals: [],
      showNewChip: false,
    },
    template: `
      <story-journal-feed-harness
        [weeklyJournals]="weeklyJournals"
        [dailyJournals]="dailyJournals"
        [allJournals]="allJournals"
        [showNewChip]="showNewChip"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Clicked: none')).toBeInTheDocument();
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: renderHarness,
  decorators: [
    withHessaProviders({ layout: true, mobile: false, locale: 'en' }),
  ],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: renderHarness,
  decorators: [
    withHessaProviders({ layout: true, mobile: false, locale: 'ar' }),
    componentWrapperDecorator(
      (story) =>
        `<div class="w-[520px] max-w-full p-ds-xl" lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
