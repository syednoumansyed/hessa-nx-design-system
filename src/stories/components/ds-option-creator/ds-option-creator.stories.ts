import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import {
  DsSelectOptionCreatorComponent,
  QuestionOption,
} from '@ds/option-creator/select-option-creator/select-option-creator.component';
import { DsSelectOptionCreatorItemComponent } from '@ds/option-creator/multiple-select-item/select-option-creator-item.component';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

/**
 * # Option Creator — `ds-select-option-creator`
 *
 * An interactive editor component used to author question choices (MCQ, Multi-select,
 * or True/False). It leverages Reactive Forms internally and debounces emissions.
 */
const meta: Meta<DsSelectOptionCreatorComponent> = {
  title: '1. P0 Components/Option Creator',
  component: DsSelectOptionCreatorComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({ ionic: true, translocoTesting: true }),
    moduleMetadata({
      imports: [
        DsSelectOptionCreatorComponent,
        DsSelectOptionCreatorItemComponent,
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="p-ds-lg max-w-[520px] bg-surface-primary rounded-ds-xl border border-neutral-cool-300">${story}</div>`,
    ),
  ],
  argTypes: {
    type: {
      control: 'select',
      options: ['MCQ', 'MULTI_SELECT', 'TRUE_OR_FALSE'],
      description:
        'Choice editing mode: single selection (MCQ), multiple selection, or True/False.',
    },
    questionOptions: {
      control: 'object',
      description: 'Initial question options list.',
    },
  },
};

export default meta;
type Story = StoryObj<DsSelectOptionCreatorComponent>;

const mockOptions: QuestionOption[] = [
  { text: 'Red', isCorrect: true },
  { text: 'Green', isCorrect: false },
  { text: 'Blue', isCorrect: false },
];

// ─── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {
  name: 'Default (MCQ Mode)',
  args: {
    type: 'MCQ',
    questionOptions: mockOptions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Locate the first option input field
    const inputEl = canvasElement.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    await expect(inputEl).toBeInTheDocument();

    // Type a new value
    await userEvent.clear(inputEl);
    await userEvent.type(inputEl, 'Crimson Red');
    await expect(inputEl.value).toBe('Crimson Red');

    // Click "Add Option +" button
    const addBtn = canvas.getByRole('button', { name: /Add Option/i });
    await expect(addBtn).toBeInTheDocument();
    await userEvent.click(addBtn);

    // Verify a 4th input block is added to the DOM
    const allInputs = canvasElement.querySelectorAll('input[type="text"]');
    await expect(allInputs.length).toBe(4);
  },
};

// ─── Multi-select ─────────────────────────────────────────────────────────────
export const MultiSelect: Story = {
  name: 'Mode: Multi-select',
  args: {
    type: 'MULTI_SELECT',
    questionOptions: mockOptions,
  },
};

// ─── True or False ────────────────────────────────────────────────────────────
export const TrueOrFalse: Story = {
  name: 'Mode: True or False',
  args: {
    type: 'TRUE_OR_FALSE',
    questionOptions: [
      { text: 'TRUE', isCorrect: true },
      { text: 'FALSE', isCorrect: false },
    ],
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────
export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    type: 'MCQ',
    questionOptions: mockOptions,
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
    type: 'MCQ',
    questionOptions: [
      { text: 'أحمر', isCorrect: true },
      { text: 'أخضر', isCorrect: false },
      { text: 'أزرق', isCorrect: false },
    ],
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
