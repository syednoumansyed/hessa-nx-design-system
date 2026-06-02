import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { DsActionListComponent } from '@ds/action-list/action-list.component';
import { DsActionListItemComponent } from '@ds/action-list/action-list-item.component';
import {
  DsActionListConfig,
  DsActionListItemConfig,
} from '@ds/action-list/action-list.interface';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

/**
 * # Action List — `ds-action-list`
 *
 * A scrollable list of tappable action items, typically used inside a sidebar or sheet.
 * Each item supports a title, optional upper supporting text, avatar, supporting text
 * with icons/counts, and an end-icon arrow.
 *
 * Uses classic `@Input()` decorator (not signal inputs) — bind via `[config]` and `[closeCb]`.
 *
 * **When to use:** Navigation drawers, option pickers, action menus.
 */
const meta: Meta<DsActionListComponent> = {
  title: '3. P2 Components/ActionList',
  component: DsActionListComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Scrollable list of tappable action items. Supports avatars, supporting text, badges, and active-state highlighting. Typically rendered inside a sidebar or modal sheet.',
      },
    },
    a11y: { config: { rules: [] } },
    layout: 'padded',
  },
  argTypes: {},
  decorators: [
    withHessaProviders(),
    moduleMetadata({
      imports: [DsActionListComponent, DsActionListItemComponent],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div style="max-width:380px;height:500px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-family:'Nunito',sans-serif">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsActionListComponent>;

// ─── Shared configs ───────────────────────────────────────────────────────────

const basicConfig: DsActionListConfig = {
  title: 'Choose an Action',
  showCloseButton: true,
  items: [
    {
      id: '1',
      title: 'My Profile',
      endIconConfig: { showArrow: true },
    },
    {
      id: '2',
      title: 'Courses',
      endIconConfig: { showArrow: true },
    },
    {
      id: '3',
      title: 'Assignments',
      endIconConfig: { showArrow: true },
    },
    {
      id: '4',
      title: 'Notifications',
      endIconConfig: { showArrow: true },
    },
    {
      id: '5',
      title: 'Settings',
      endIconConfig: { showArrow: true },
    },
  ],
};

const withActiveConfig: DsActionListConfig = {
  title: 'Navigation',
  items: [
    {
      id: '1',
      title: 'Dashboard',
      endIconConfig: { showArrow: true },
    },
    {
      id: '2',
      title: 'My Courses',
      endIconConfig: { showArrow: true },
    },
    {
      id: '3',
      title: 'Assignments',
      endIconConfig: { showArrow: true },
    },
  ],
  activeItemIndex: 1,
};

const withSupportingTextConfig: DsActionListConfig = {
  title: 'Courses',
  items: [
    {
      id: '1',
      title: 'Mathematics 101',
      upperSupportingText: 'Grade 5',
      supportingText: [
        { text: '12 lessons', variant: 'default' },
        { text: '3 pending', variant: 'danger', count: 3 },
      ],
      endIconConfig: { showArrow: true },
    },
    {
      id: '2',
      title: 'Arabic Language',
      upperSupportingText: 'Grade 5',
      supportingText: [
        { text: '8 lessons', variant: 'default' },
        { text: 'All done', variant: 'success', count: 0 },
      ],
      endIconConfig: { showArrow: true },
    },
    {
      id: '3',
      title: 'Science',
      upperSupportingText: 'Grade 5',
      supportingText: { text: '6 lessons', variant: 'default' },
      endIconConfig: { showArrow: true },
    },
  ],
};

const withAvatarConfig: DsActionListConfig = {
  title: 'Select Student',
  items: [
    {
      id: '1',
      title: 'Sara Abdullah',
      upperSupportingText: 'Grade 4',
      avatar: { fullName: 'Sara Abdullah' },
      endIconConfig: { showArrow: true },
    },
    {
      id: '2',
      title: 'Mohammed Ali',
      upperSupportingText: 'Grade 5',
      avatar: { fullName: 'Mohammed Ali' },
      endIconConfig: { showArrow: true },
    },
    {
      id: '3',
      title: 'Fatima Hassan',
      upperSupportingText: 'Grade 3',
      avatar: { fullName: 'Fatima Hassan' },
      endIconConfig: { showArrow: true },
    },
  ],
};

const arabicConfig: DsActionListConfig = {
  title: 'اختر إجراءً',
  showCloseButton: true,
  items: [
    {
      id: '1',
      title: 'ملفي الشخصي',
      endIconConfig: { showArrow: true },
    },
    {
      id: '2',
      title: 'المقررات',
      endIconConfig: { showArrow: true },
    },
    {
      id: '3',
      title: 'الواجبات',
      endIconConfig: { showArrow: true },
    },
    {
      id: '4',
      title: 'الإشعارات',
      endIconConfig: { showArrow: true },
    },
    {
      id: '5',
      title: 'الإعدادات',
      endIconConfig: { showArrow: true },
    },
  ],
};

const disabledItemConfig: DsActionListItemConfig = {
  id: 'disabled',
  title: 'Archived assignment',
  upperSupportingText: 'No actions available',
  supportingText: { text: 'Read-only', variant: 'default' },
  endIconConfig: { showArrow: true },
};

const dangerItemConfig: DsActionListItemConfig = {
  id: 'danger',
  title: 'Late submissions',
  upperSupportingText: 'Grade 5 Mathematics',
  supportingText: { text: '2 overdue', variant: 'danger', count: 2 },
  endIconConfig: { showArrow: true },
};

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default (LTR)',
  render: () => ({
    template: `<ds-action-list [config]="config" [closeCb]="closeCb"></ds-action-list>`,
    props: {
      config: basicConfig,
      closeCb: () => {},
    },
  }),
};

export const LTR: Story = {
  name: 'LTR (English)',
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div dir="ltr" lang="en" style="max-width:380px;height:500px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-family:'Nunito',sans-serif">${story}</div>`,
    ),
  ],
  render: () => ({
    template: `<ds-action-list [config]="config" [closeCb]="closeCb"></ds-action-list>`,
    props: {
      config: basicConfig,
      closeCb: () => {},
    },
  }),
};

export const WithActiveItem: Story = {
  name: 'With Active Item',
  render: () => ({
    template: `<ds-action-list [config]="config" [closeCb]="closeCb"></ds-action-list>`,
    props: {
      config: withActiveConfig,
      closeCb: () => {},
    },
  }),
};

export const WithSupportingText: Story = {
  name: 'With Supporting Text & Badges',
  render: () => ({
    template: `<ds-action-list [config]="config" [closeCb]="closeCb"></ds-action-list>`,
    props: {
      config: withSupportingTextConfig,
      closeCb: () => {},
    },
  }),
};

export const WithAvatars: Story = {
  name: 'With Avatars (Student Picker)',
  render: () => ({
    template: `<ds-action-list [config]="config" [closeCb]="closeCb"></ds-action-list>`,
    props: {
      config: withAvatarConfig,
      closeCb: () => {},
    },
  }),
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div dir="rtl" lang="ar" style="max-width:380px;height:500px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-family:'Lama Rounded',sans-serif">${story}</div>`,
    ),
  ],
  render: () => ({
    template: `<ds-action-list [config]="config" [closeCb]="closeCb"></ds-action-list>`,
    props: {
      config: arabicConfig,
      closeCb: () => {},
    },
  }),
};

export const Disabled: Story = {
  name: 'State: Disabled item',
  render: () => ({
    template: `
      <div class="flex flex-col gap-3">
        <ds-action-list-item
          [config]="config"
          [disabled]="true"
          (itemClick)="clicked = clicked + 1"
        ></ds-action-list-item>
        <p data-testid="click-count" class="content-sm-default text-emphasis-mid">
          Clicked: {{ clicked }}
        </p>
      </div>
    `,
    props: {
      config: disabledItemConfig,
      clicked: 0,
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('ds-list-item-disabled'));
    await expect(canvas.getByTestId('click-count')).toHaveTextContent(
      'Clicked: 0',
    );
  },
};

export const Error: Story = {
  name: 'State: Danger supporting text',
  render: () => ({
    template: `<ds-action-list-item [config]="config"></ds-action-list-item>`,
    props: {
      config: dangerItemConfig,
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('2 overdue')).toHaveClass(
      'text-content-error',
    );
  },
};

export const RealWorldUsage: Story = {
  name: 'Real-World: Course Navigation Drawer',
  render: () => ({
    template: `<ds-action-list [config]="config" [closeCb]="closeCb"></ds-action-list>`,
    props: {
      config: {
        title: 'Course Sections',
        showCloseButton: true,
        activeItemIndex: 2,
        items: [
          {
            id: 's1',
            title: 'Introduction',
            upperSupportingText: 'Section 1',
            supportingText: { text: '3 lessons', variant: 'default' },
            endIconConfig: { showArrow: true },
          },
          {
            id: 's2',
            title: 'Core Concepts',
            upperSupportingText: 'Section 2',
            supportingText: [
              { text: '5 lessons', variant: 'default' },
              { text: '2 pending', variant: 'danger', count: 2 },
            ],
            endIconConfig: { showArrow: true },
          },
          {
            id: 's3',
            title: 'Exercises',
            upperSupportingText: 'Section 3',
            supportingText: [
              { text: '4 lessons', variant: 'default' },
              { text: 'Completed', variant: 'success' },
            ],
            endIconConfig: { showArrow: true },
          },
          {
            id: 's4',
            title: 'Final Quiz',
            upperSupportingText: 'Section 4',
            supportingText: { text: '1 lesson', variant: 'default' },
            endIconConfig: { showArrow: true },
          },
        ],
      } satisfies DsActionListConfig,
      closeCb: () => {},
    },
  }),
};
