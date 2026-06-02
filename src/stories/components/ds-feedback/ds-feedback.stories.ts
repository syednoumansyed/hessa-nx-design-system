import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsFeedbackComponent } from '@ds/feedback/feedback.component';

/**
 * # Feedback — `ds-feedback`
 *
 * A **content-only** component displaying a contextual illustration (icon),
 * title, and optional message for status feedback states. Designed to be
 * slotted inside a modal opened by `FeedbackService` — it does not render
 * its own backdrop or action buttons.
 *
 * **When to use:**
 * - Inside a modal to confirm a destructive action (error)
 * - After a successful submission (success)
 * - To prompt the user with a yes/no question (question)
 *
 * **When NOT to use:**
 * - Inline, non-modal status messages → use `ds-alert-message`
 * - As a standalone page-level empty state — use a custom illustration
 *
 * **Responsive tokens:** Icon and text sizing use `--font-size-*` variables.
 */
const meta: Meta<DsFeedbackComponent> = {
  title: '1. P0 Components/Feedback',
  component: DsFeedbackComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Status feedback content component. Renders an icon, title, and message. Intended for use inside DsModalService-powered overlays. 6 types: success, error, warning, exciting, info, question.',
      },
    },
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['success', 'error', 'warning', 'exciting', 'info', 'question'],
      description: 'Feedback type — controls icon and colour',
    },
    title: { control: 'text' },
    message: { control: 'text' },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({ imports: [DsFeedbackComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsFeedbackComponent>;

// ─── Type: Success ────────────────────────────────────────────────────────────

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Assignment submitted',
    message: 'Your work has been saved and sent to your teacher.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Assignment submitted'),
    ).toBeInTheDocument();
  },
};

// ─── Type: Error ──────────────────────────────────────────────────────────────

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Something went wrong',
    message: 'We could not save your changes. Please try again.',
  },
};

// ─── Type: Warning ────────────────────────────────────────────────────────────

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Unsaved changes',
    message: 'You have changes that have not been saved. Do you want to continue?',
  },
};

// ─── Type: Question ───────────────────────────────────────────────────────────

export const Question: Story = {
  args: {
    type: 'question',
    title: 'Delete assignment?',
    message: 'This action cannot be undone.',
  },
};

// ─── Type: Info ───────────────────────────────────────────────────────────────

export const Info: Story = {
  args: {
    type: 'info',
    title: 'New feature available',
    message: 'You can now track attendance directly from the dashboard.',
  },
};

// ─── Type: Exciting ───────────────────────────────────────────────────────────

export const Exciting: Story = {
  name: 'Type: exciting',
  args: {
    type: 'exciting',
    title: 'Achievement unlocked!',
    message: 'You completed 10 assignments in a row. Keep it up!',
  },
};

// ─── Title Only ───────────────────────────────────────────────────────────────

export const TitleOnly: Story = {
  name: 'Title only (no message)',
  args: {
    type: 'success',
    title: 'Saved successfully',
  },
};

// ─── All Types Showcase ───────────────────────────────────────────────────────

export const AllTypes: Story = {
  name: 'All Types',
  render: () => ({
    template: `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:16px;">
        <ds-feedback type="success" title="Success" message="Operation completed." />
        <ds-feedback type="error" title="Error" message="Something went wrong." />
        <ds-feedback type="warning" title="Warning" message="Proceed with caution." />
        <ds-feedback type="question" title="Confirm?" message="Are you sure?" />
        <ds-feedback type="info" title="Info" message="Here is some information." />
        <ds-feedback type="exciting" title="Great job!" message="You did it!" />
      </div>
    `,
  }),
};

// ─── LTR ──────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    type: 'success',
    title: 'Assignment submitted successfully',
    message: 'Your teacher will review it shortly.',
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:24px;">${story}</div>`,
    ),
  ],
};

// ─── RTL ──────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    type: 'success',
    title: 'تم تسليم الواجب بنجاح',
    message: 'سيراجعه معلمك قريبًا.',
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:24px;">${story}</div>`,
    ),
  ],
};
