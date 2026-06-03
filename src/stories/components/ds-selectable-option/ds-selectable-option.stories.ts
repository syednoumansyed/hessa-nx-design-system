import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { SelectableOptionGroupComponent } from '@ds/selectable-option/selectable-option-group.component';
import { SelectableOptionComponent } from '@ds/selectable-option/selectable-option.component';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

/**
 * # Selectable Option — `app-ds-selectable-option-group` & `ds-selectable-option`
 *
 * A list selection control used for quiz questions, multiple choice options, and
 * item selection flows. Supports two modes:
 * - `attempt` (Interactive selection mode)
 * - `view` (Read-only review mode with correct/incorrect answers revealed)
 *
 * RTL alignment and layout roles are fully supported.
 */
const meta: Meta<SelectableOptionGroupComponent> = {
  title: '1. P0 Components/Selectable Option',
  component: SelectableOptionGroupComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({ ionic: true }),
    moduleMetadata({
      imports: [SelectableOptionGroupComponent, SelectableOptionComponent],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="p-ds-lg max-w-[480px] bg-surface-primary">${story}</div>`,
    ),
  ],
  argTypes: {
    config: {
      control: 'object',
      description:
        'Configuration object detailing options, mode, correct value, and reveal flag.',
    },
  },
};

export default meta;
type Story = StoryObj<SelectableOptionGroupComponent>;

const mockOptions = [
  { value: 'opt-a', display: 'Option A: Riyadh is the capital' },
  { value: 'opt-b', display: 'Option B: Jeddah is the capital' },
  { value: 'opt-c', display: 'Option C: Dammam is the capital' },
];

// ─── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {
  name: 'Default (Attempt Mode)',
  args: {
    config: {
      options: mockOptions,
      mode: 'attempt',
      correctOptionValue: 'opt-a',
      revealAnswer: false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Find all radio options
    const optionB = canvas.getByText('Option B: Jeddah is the capital');
    await expect(optionB).toBeInTheDocument();

    // Click Option B
    await userEvent.click(optionB);

    // Verify option container state or check selection state
    const optionContainer = optionB.closest('[role="radio"]');
    await expect(optionContainer).toHaveAttribute('aria-checked', 'true');
  },
};

// ─── Disabled ────────────────────────────────────────────────────────────────
export const Disabled: Story = {
  name: 'State: Disabled (View Mode without Reveal)',
  args: {
    config: {
      options: mockOptions,
      mode: 'view',
      correctOptionValue: 'opt-a',
      revealAnswer: false,
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-selectable-option-group
        [config]="config"
        [ngModel]="'opt-b'"
      ></app-ds-selectable-option-group>
    `,
  }),
};

// ─── Error ───────────────────────────────────────────────────────────────────
export const Error: Story = {
  name: 'State: Error (Reveal Incorrect Selection)',
  args: {
    config: {
      options: mockOptions,
      mode: 'view',
      correctOptionValue: 'opt-a',
      revealAnswer: true,
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-selectable-option-group
        [config]="config"
        [ngModel]="'opt-b'"
      ></app-ds-selectable-option-group>
    `,
  }),
};

// ─── LTR ─────────────────────────────────────────────────────────────────────
export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    config: {
      options: mockOptions,
      mode: 'attempt',
      correctOptionValue: 'opt-a',
      revealAnswer: false,
    },
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
    config: {
      options: [
        { value: 'a', display: 'الخيار أ: الرياض هي العاصمة' },
        { value: 'b', display: 'الخيار ب: جدة هي العاصمة' },
        { value: 'c', display: 'الخيار ج: الدمام هي العاصمة' },
      ],
      mode: 'view',
      correctOptionValue: 'a',
      revealAnswer: true,
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <app-ds-selectable-option-group
        [config]="config"
        [ngModel]="'b'"
      ></app-ds-selectable-option-group>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
