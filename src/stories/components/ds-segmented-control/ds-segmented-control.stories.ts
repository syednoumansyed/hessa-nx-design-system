import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import {
  DsSegmentedControlComponent,
  DsSegmentedControlOption,
} from '@ds/segmented-control/segmented-control.component';

/**
 * # Segmented Control — `ds-segmented-control`
 *
 * A tab-bar style selector for mutually exclusive options. Renders as a
 * `role="tablist"` for accessibility.
 *
 * **Inputs:**
 * - `options` — array of `{ id, label, disabled? }` objects
 * - `value` — the currently selected option id
 *
 * **Outputs:** `valueChange` — emits the id of the newly selected option
 */
const meta: Meta<DsSegmentedControlComponent> = {
  title: '3. P2 Components/SegmentedControl',
  component: DsSegmentedControlComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsSegmentedControlComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="max-width:480px;padding:16px;">${story}</div>`,
    ),
  ],
  argTypes: {
    options: { control: 'object' },
    value: { control: 'text' },
  },
  parameters: {
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          { id: 'aria-required-attr', enabled: true },
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<DsSegmentedControlComponent>;

// ─── Shared option sets ───────────────────────────────────────────────────────

const twoOptions: DsSegmentedControlOption[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
];

const threeOptions: DsSegmentedControlOption[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

const fourOptions: DsSegmentedControlOption[] = [
  { id: 'math', label: 'Math' },
  { id: 'science', label: 'Science' },
  { id: 'english', label: 'English' },
  { id: 'arabic', label: 'Arabic' },
];

const withDisabled: DsSegmentedControlOption[] = [
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'locked', label: 'Locked', disabled: true },
];

// ─── Default (2 options) ──────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default — 2 Options',
  args: {
    options: twoOptions,
    value: 'all',
  },
};

// ─── Three options ────────────────────────────────────────────────────────────

export const ThreeOptions: Story = {
  name: '3 Options',
  args: {
    options: threeOptions,
    value: 'week',
  },
};

// ─── Four options ─────────────────────────────────────────────────────────────

export const FourOptions: Story = {
  name: '4 Options',
  args: {
    options: fourOptions,
    value: 'math',
  },
};

// ─── No selection ─────────────────────────────────────────────────────────────

export const NoSelection: Story = {
  name: 'No Selection',
  args: {
    options: threeOptions,
    value: undefined,
  },
};

// ─── With disabled option ─────────────────────────────────────────────────────

export const WithDisabledOption: Story = {
  name: 'With Disabled Option',
  args: {
    options: withDisabled,
    value: 'active',
  },
};

// ─── First option selected ────────────────────────────────────────────────────

export const FirstSelected: Story = {
  name: 'First Option Selected',
  args: {
    options: threeOptions,
    value: 'day',
  },
};

// ─── Last option selected ─────────────────────────────────────────────────────

export const LastSelected: Story = {
  name: 'Last Option Selected',
  args: {
    options: threeOptions,
    value: 'month',
  },
};

// ─── RTL (Arabic) ─────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL — Arabic',
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="max-width:480px;padding:16px;font-family:'Lama Rounded',sans-serif;">${story}</div>`,
    ),
  ],
  args: {
    options: [
      { id: 'all', label: 'الكل' },
      { id: 'mine', label: 'خاصتي' },
      { id: 'shared', label: 'مشترك' },
    ],
    value: 'all',
  },
};

export const RTLWithDisabled: Story = {
  name: 'RTL — Arabic With Disabled',
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="max-width:480px;padding:16px;font-family:'Lama Rounded',sans-serif;">${story}</div>`,
    ),
  ],
  args: {
    options: [
      { id: 'active', label: 'نشط' },
      { id: 'pending', label: 'قيد الانتظار' },
      { id: 'locked', label: 'مقفل', disabled: true },
    ],
    value: 'active',
  },
};

// ─── All Variants grid ────────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div>
          <p style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">2 options</p>
          <ds-segmented-control
            [options]="[{id:'all',label:'All'},{id:'mine',label:'Mine'}]"
            [value]="'all'"
          ></ds-segmented-control>
        </div>
        <div>
          <p style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">3 options — middle selected</p>
          <ds-segmented-control
            [options]="[{id:'day',label:'Day'},{id:'week',label:'Week'},{id:'month',label:'Month'}]"
            [value]="'week'"
          ></ds-segmented-control>
        </div>
        <div>
          <p style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">4 options</p>
          <ds-segmented-control
            [options]="[{id:'math',label:'Math'},{id:'science',label:'Science'},{id:'english',label:'English'},{id:'arabic',label:'Arabic'}]"
            [value]="'science'"
          ></ds-segmented-control>
        </div>
        <div>
          <p style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">With disabled option</p>
          <ds-segmented-control
            [options]="[{id:'active',label:'Active'},{id:'pending',label:'Pending'},{id:'locked',label:'Locked',disabled:true}]"
            [value]="'active'"
          ></ds-segmented-control>
        </div>
        <div>
          <p style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">No selection</p>
          <ds-segmented-control
            [options]="[{id:'day',label:'Day'},{id:'week',label:'Week'},{id:'month',label:'Month'}]"
          ></ds-segmented-control>
        </div>
      </div>
    `,
  }),
};
