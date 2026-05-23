import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsFeedbackComponent } from '@ds/feedback/feedback.component';

/**
 * # Feedback Modal — `app-ds-feedback`
 *
 * Full-screen feedback overlay for confirming results of actions. Shown inside a
 * `DsModal` via `DsModalService`. Covers success confirmations, error explanations,
 * and warning prompts.
 *
 * In production this is opened via `DsModalService.open({ component: DsFeedbackComponent })`.
 * These stories render the component shell directly.
 *
 * **Feedback types:** `success` | `error` | `warning` | `question`
 *
 * **When to use:** After a significant action completes (save, delete, submit).
 * **When NOT to use:** Brief notifications → use toast (ngx-toastr). Inline validation → use input error state.
 */
const meta: Meta<DsFeedbackComponent> = {
  title: '1. P0 Components/Feedback Modal',
  component: DsFeedbackComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    a11y: { config: { rules: [] } },
  },
  argTypes: {
    type: { control: 'select', options: ['success', 'error', 'warning', 'question'] },
    title: { control: 'text' },
    message: { control: 'text' },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsFeedbackComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="max-width:360px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsFeedbackComponent>;

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Saved Successfully',
    message: 'Your changes have been saved.',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Something went wrong',
    message: 'Unable to save your changes. Please try again.',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Are you sure?',
    message: 'This will remove the student from the class permanently.',
  },
};

export const Question: Story = {
  args: {
    type: 'question',
    title: 'Confirm deletion',
    message: 'This action cannot be undone. Do you want to continue?',
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    type: 'success',
    title: 'Grade Submitted',
    message: 'The grade has been recorded for this student.',
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;max-width:360px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">${story}</div>`,
    ),
  ],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    type: 'success',
    title: 'تم الحفظ بنجاح',
    message: 'تم تسجيل الدرجة لهذا الطالب.',
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;max-width:360px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">${story}</div>`,
    ),
  ],
};
