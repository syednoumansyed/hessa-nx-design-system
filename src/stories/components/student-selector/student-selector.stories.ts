import { Component, Input } from '@angular/core';
import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import {
  DsStudentSelectorComponent,
  Student,
} from '@ds/student-selector/student-selector.component';
import { UserProfileColors, UserStatus } from '@shared/enums';

@Component({
  selector: 'story-student-selector-harness',
  standalone: true,
  imports: [DsStudentSelectorComponent],
  template: `
    <div class="flex flex-col gap-ds-md">
      <app-ds-student-selector
        [students]="students"
        [defaultSelectedId]="defaultSelectedId"
        [enableAllOption]="enableAllOption"
        (studentSelected)="selected = $event.fullName"
      />
      <p class="content-sm-default text-content-mid">
        Selected: {{ selected || 'none' }}
      </p>
    </div>
  `,
})
class StoryStudentSelectorHarnessComponent {
  @Input() students: Student[] = [];
  @Input() defaultSelectedId = '0';
  @Input() enableAllOption = true;

  selected = '';
}

const students: Student[] = [
  {
    id: '1',
    fullName: 'Ahmed Al-Rashid',
    class: '5-A',
    level: 'Grade 5',
    imageUrl: '',
    profileColor: UserProfileColors.BRAND,
    status: UserStatus.ACTIVE,
  },
  {
    id: '2',
    fullName: 'Sara Al-Mansouri',
    class: '6-B',
    level: 'Grade 6',
    imageUrl: '',
    profileColor: UserProfileColors.EMERALD,
    status: UserStatus.ACTIVE,
  },
  {
    id: '3',
    fullName: 'Omar Abdullah',
    class: '7-C',
    level: 'Grade 7',
    imageUrl: '',
    profileColor: UserProfileColors.BLUE,
    status: UserStatus.PAUSED,
  },
];

/**
 * # Student Selector
 *
 * Responsive student picker. Desktop renders a vertical detail list; mobile
 * renders horizontally scrollable chips.
 */
const meta: Meta<DsStudentSelectorComponent> = {
  title: '2. P1 Components/Student Selector',
  component: DsStudentSelectorComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Student selector with optional All Students item, selected state, inactive/paused warning icon, and desktop/mobile LayoutService branches.',
      },
    },
  },
  argTypes: {
    students: { control: 'object' },
    defaultSelectedId: { control: 'text' },
    enableAllOption: { control: 'boolean' },
  },
  decorators: [
    withHessaProviders({
      layout: true,
      mobile: false,
      translocoTesting: true,
    }),
    moduleMetadata({
      imports: [
        DsStudentSelectorComponent,
        StoryStudentSelectorHarnessComponent,
      ],
    }),
    componentWrapperDecorator(
      (story) => `<div class="w-[360px] max-w-full p-ds-xl">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsStudentSelectorComponent>;

const renderHarness = (
  defaultSelectedId = '0',
  enableAllOption = true,
) => ({
  props: {
    students,
    defaultSelectedId,
    enableAllOption,
  },
  template: `
    <story-student-selector-harness
      [students]="students"
      [defaultSelectedId]="defaultSelectedId"
      [enableAllOption]="enableAllOption"
    />
  `,
});

export const Default: Story = {
  render: () => renderHarness(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('All Students')).toBeInTheDocument();
    await userEvent.click(await canvas.findByText('Sara Al-Mansouri'));
    await expect(
      await canvas.findByText('Selected: Sara Al-Mansouri'),
    ).toBeInTheDocument();
  },
};

export const WithoutAllOption: Story = {
  name: 'Without all option',
  render: () => renderHarness('1', false),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('All Students')).not.toBeInTheDocument();
    await expect(await canvas.findByText('Ahmed Al-Rashid')).toBeInTheDocument();
  },
};

export const StatusWarning: Story = {
  name: 'Paused status warning',
  render: () => renderHarness('3', true),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByAltText('warning')).toBeInTheDocument();
  },
};

export const Mobile: Story = {
  render: () => renderHarness(),
  decorators: [
    withHessaProviders({
      layout: true,
      mobile: true,
      translocoTesting: true,
    }),
    componentWrapperDecorator(
      (story) => `<div class="w-[390px] max-w-full p-ds-md">${story}</div>`,
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('All')).toBeInTheDocument();
  },
};

export const ReadOnlyEmptyState: Story = {
  name: 'Read-only empty state',
  render: () => ({
    props: {
      students: [],
      defaultSelectedId: '0',
      enableAllOption: false,
    },
    template: `
      <story-student-selector-harness
        [students]="students"
        [defaultSelectedId]="defaultSelectedId"
        [enableAllOption]="enableAllOption"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Selected: none')).toBeInTheDocument();
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => renderHarness(),
  decorators: [
    withHessaProviders({
      layout: true,
      mobile: false,
      locale: 'en',
      translocoTesting: true,
    }),
  ],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => renderHarness(),
  decorators: [
    withHessaProviders({
      layout: true,
      mobile: false,
      locale: 'ar',
      translocoTesting: true,
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="w-[360px] max-w-full p-ds-xl" lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
