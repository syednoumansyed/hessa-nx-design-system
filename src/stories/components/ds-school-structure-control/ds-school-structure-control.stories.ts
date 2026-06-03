import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { DsSchoolStructureControlComponent } from '@ds/school-structure-control/ds-school-structure-control.component';
import { DsSchoolStructureTreeComponent } from '@ds/school-structure-control/components/tree/ds-school-structure-tree.component';
import { DsSchoolStructureNodeComponent } from '@ds/school-structure-control/components/node/ds-school-structure-node.component';
import { DsSchoolStructureApiService } from '@ds/school-structure-control/services/ds-school-structure-api.service';
import { DsModalService } from '@ds/modal';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { OverlayModule } from '@angular/cdk/overlay';

// Mock school structure tree nodes
const mockTreeNodes = [
  {
    id: 1,
    name: 'Main Company',
    type: 'company',
    hasAccess: true,
    isExpanded: true,
    children: [
      {
        id: 2,
        name: 'Campus Alpha',
        type: 'campus',
        hasAccess: true,
        isExpanded: true,
        children: [
          {
            id: 3,
            name: 'School One',
            type: 'school',
            hasAccess: true,
            isExpanded: false,
            children: [],
          },
        ],
      },
    ],
  },
];

class MockDsSchoolStructureApiService {
  getSchoolStructure() {
    return JSON.parse(JSON.stringify(mockTreeNodes));
  }
}

const mockDsModalService = {
  open: async () => ({
    onDismiss: async () => ({ role: 'close' }),
    onWillDismiss: async () => ({ role: 'close' }),
    dismiss: async () => {},
  }),
};

/**
 * # School Structure Control — `app-ds-school-structure-control`
 *
 * A scope-selector tree component that allows administrators/teachers to pick
 * campuses or schools. Renders as a popover tree on desktop and a modal bottom-sheet on mobile.
 */
const meta: Meta<DsSchoolStructureControlComponent> = {
  title: '1. P0 Components/School Structure Control',
  component: DsSchoolStructureControlComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({ ionic: true, translocoTesting: true }),
    moduleMetadata({
      imports: [
        DsSchoolStructureControlComponent,
        DsSchoolStructureTreeComponent,
        DsSchoolStructureNodeComponent,
        OverlayModule,
      ],
      providers: [
        {
          provide: DsSchoolStructureApiService,
          useClass: MockDsSchoolStructureApiService,
        },
        { provide: DsModalService, useValue: mockDsModalService },
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="p-ds-2xl max-w-[480px] bg-surface-primary rounded-ds-xl border border-neutral-cool-300 min-h-[300px]">${story}</div>`,
    ),
  ],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    isMultiSelect: { control: 'boolean' },
    required: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DsSchoolStructureControlComponent>;

// ─── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {
  name: 'Default (Desktop Popover)',
  args: {
    label: 'Campus Scope Select',
    placeholder: 'Select structures...',
    isMultiSelect: true,
    required: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-school-structure-control
        [label]="label"
        [placeholder]="placeholder"
        [isMultiSelect]="isMultiSelect"
        [required]="required"
        [ngModel]="[]"
      ></app-ds-school-structure-control>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find input field trigger
    const inputTrigger = canvasElement.querySelector(
      'input',
    ) as HTMLInputElement;
    await expect(inputTrigger).toBeInTheDocument();

    // Click input field to reveal tree popover
    await userEvent.click(inputTrigger);

    // Verify tree overlay options appear (CDK overlay contains our tree nodes)
    const body = within(document.body);
    const companyNode = await body.findByText('Main Company');
    await expect(companyNode).toBeInTheDocument();

    // Click company node
    await userEvent.click(companyNode);
  },
};

// ─── Disabled ────────────────────────────────────────────────────────────────
export const Disabled: Story = {
  name: 'State: Disabled',
  args: {
    label: 'Scope Selection (Read Only)',
    placeholder: 'Cannot modify scope',
    isMultiSelect: true,
    required: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-school-structure-control
        [label]="label"
        [placeholder]="placeholder"
        [isMultiSelect]="isMultiSelect"
        [required]="required"
        [ngModel]="[]"
        [disabled]="true"
      ></app-ds-school-structure-control>
    `,
  }),
};

// ─── LTR ─────────────────────────────────────────────────────────────────────
export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    label: 'School Scope Select',
    placeholder: 'Select a school...',
    isMultiSelect: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-school-structure-control
        [label]="label"
        [placeholder]="placeholder"
        [isMultiSelect]="isMultiSelect"
        [ngModel]="[]"
      ></app-ds-school-structure-control>
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
    label: 'نطاق المدارس والمجمعات',
    placeholder: 'اختر مدرسة...',
    isMultiSelect: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-school-structure-control
        [label]="label"
        [placeholder]="placeholder"
        [isMultiSelect]="isMultiSelect"
        [ngModel]="[]"
      ></app-ds-school-structure-control>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
