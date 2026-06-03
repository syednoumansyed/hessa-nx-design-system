import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { ModalController } from '@ionic/angular/standalone';
import { DsIconChooserComponent } from '@ds/icon-chooser/icon-chooser.component';
import { IconChooserModalComponent } from '@ds/icon-chooser/icon-chooser-modal.component';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

// Mock ModalController to complete CVA flow in Storybook
const mockModalController = {
  create: async (options: any) => ({
    present: async () => {},
    onWillDismiss: async () => ({
      data: 'faPen',
      role: 'confirm',
    }),
  }),
};

/**
 * # Icon Chooser — `app-ds-icon-chooser`
 *
 * An interactive form field component implementing ControlValueAccessor.
 * Clicking the launcher opens a searchable overlay grid where the user can pick
 * a FontAwesome icon.
 */
const meta: Meta<DsIconChooserComponent> = {
  title: '1. P0 Components/Icon Chooser',
  component: DsIconChooserComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({ ionic: true, translocoTesting: true }),
    moduleMetadata({
      imports: [DsIconChooserComponent, IconChooserModalComponent],
      providers: [{ provide: ModalController, useValue: mockModalController }],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="p-ds-lg max-w-[480px] bg-surface-primary rounded-ds-xl border border-neutral-cool-300">${story}</div>`,
    ),
  ],
  argTypes: {
    label: { control: 'text' },
    required: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DsIconChooserComponent>;

// ─── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {
  name: 'Default',
  args: {
    label: 'Choose Category Icon',
    required: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-icon-chooser
        [label]="label"
        [required]="required"
        [ngModel]="null"
      ></app-ds-icon-chooser>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify chooser prompt label
    const chooseBtn = canvas.getByRole('button', {
      name: /support.icon.choose.action/i,
    });
    await expect(chooseBtn).toBeInTheDocument();

    // Click the button to trigger mock modal
    await userEvent.click(chooseBtn);

    // Verify changes (the mock ModalController returns 'faPen' which updates the CVA visual state to show 'Edit')
    const editBtn = await canvas.findByRole('button', {
      name: /support.icon.edit.action/i,
    });
    await expect(editBtn).toBeInTheDocument();
  },
};

// ─── Disabled ────────────────────────────────────────────────────────────────
export const Disabled: Story = {
  name: 'State: Disabled',
  args: {
    label: 'Category Icon (Read Only)',
    required: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-icon-chooser
        [label]="label"
        [required]="required"
        [ngModel]="'faPen'"
        [disabled]="true"
      ></app-ds-icon-chooser>
    `,
  }),
};

// ─── Error ───────────────────────────────────────────────────────────────────
export const Error: Story = {
  name: 'State: Required Field Error',
  args: {
    label: 'Required Icon Selector',
    required: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-icon-chooser
        [label]="label"
        [required]="required"
        [ngModel]="null"
      ></app-ds-icon-chooser>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const asterisk = canvas.getByText('*');
    await expect(asterisk).toBeInTheDocument();
    await expect(asterisk).toHaveClass('text-error');
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────
export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    label: 'Icon Selector',
    required: false,
  },
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
    label: 'اختر أيقونة',
    required: false,
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
