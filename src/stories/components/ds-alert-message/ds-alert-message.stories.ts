import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AlertMessageComponent } from '@ds/alert-message/alert-message.component';

/**
 * # Alert Message — `alert-message`
 *
 * Displays contextual feedback banners for success, error, warning, info, and
 * exciting states. Supports an optional title, body message, close button, and
 * an action button.
 *
 * **Inputs:**
 * - `type` — `'info' | 'success' | 'error' | 'warning' | 'exciting'` (default: `'info'`)
 * - `title` — optional heading text
 * - `message` — body copy
 * - `showCloseButton` — show/hide the dismiss button (default: `true`)
 * - `buttonTitle` — label for the optional action button
 *
 * **Outputs:** `actionClick`, `close`
 */
const meta: Meta<AlertMessageComponent> = {
  title: '3. P2 Components/AlertMessage',
  component: AlertMessageComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [AlertMessageComponent] }),
    componentWrapperDecorator(
      (story) =>
        `<div style="max-width:480px;padding:16px;">${story}</div>`,
    ),
  ],
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'success', 'error', 'warning', 'exciting'],
      description: 'Visual feedback variant',
    },
    title: { control: 'text' },
    message: { control: 'text' },
    showCloseButton: { control: 'boolean' },
    buttonTitle: { control: 'text' },
  },
  parameters: {
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<AlertMessageComponent>;

// ─── Individual type stories ──────────────────────────────────────────────────

export const Info: Story = {
  name: 'Info',
  args: {
    type: 'info',
    title: 'Did you know?',
    message: 'You can manage your notifications from the settings page.',
    showCloseButton: true,
    buttonTitle: '',
  },
};

export const Success: Story = {
  name: 'Success',
  args: {
    type: 'success',
    title: 'Changes saved',
    message: 'Your profile has been updated successfully.',
    showCloseButton: true,
    buttonTitle: '',
  },
};

export const Warning: Story = {
  name: 'Warning',
  args: {
    type: 'warning',
    title: 'Action required',
    message: 'Your session will expire in 5 minutes. Please save your work.',
    showCloseButton: true,
    buttonTitle: '',
  },
};

export const Error: Story = {
  name: 'Error',
  args: {
    type: 'error',
    title: 'Something went wrong',
    message: 'We could not process your request. Please try again.',
    showCloseButton: true,
    buttonTitle: '',
  },
};

export const Exciting: Story = {
  name: 'Exciting',
  args: {
    type: 'exciting',
    title: 'New feature unlocked!',
    message: 'You now have access to the advanced analytics dashboard.',
    showCloseButton: true,
    buttonTitle: '',
  },
};

// ─── Without close button ─────────────────────────────────────────────────────

export const NoCloseButton: Story = {
  name: 'No Close Button',
  args: {
    type: 'info',
    title: 'Persistent notice',
    message: 'This alert cannot be dismissed by the user.',
    showCloseButton: false,
    buttonTitle: '',
  },
};

// ─── Title only (no message) ──────────────────────────────────────────────────

export const TitleOnly: Story = {
  name: 'Title Only',
  args: {
    type: 'success',
    title: 'Payment confirmed.',
    message: '',
    showCloseButton: true,
    buttonTitle: '',
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
    type: 'info',
    title: 'هل تعلم؟',
    message: 'يمكنك إدارة إشعاراتك من صفحة الإعدادات.',
    showCloseButton: true,
    buttonTitle: '',
  },
};

export const RTLError: Story = {
  name: 'RTL — Arabic Error',
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="max-width:480px;padding:16px;font-family:'Lama Rounded',sans-serif;">${story}</div>`,
    ),
  ],
  args: {
    type: 'error',
    title: 'حدث خطأ ما',
    message: 'لم نتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى.',
    showCloseButton: true,
    buttonTitle: '',
  },
};

// ─── All Variants grid ────────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <alert-message
          [type]="'info'"
          [title]="'Info alert'"
          [message]="'Informational message for the user.'"
          [showCloseButton]="true"
        ></alert-message>
        <alert-message
          [type]="'success'"
          [title]="'Success alert'"
          [message]="'Your action completed successfully.'"
          [showCloseButton]="true"
        ></alert-message>
        <alert-message
          [type]="'warning'"
          [title]="'Warning alert'"
          [message]="'Please review before proceeding.'"
          [showCloseButton]="true"
        ></alert-message>
        <alert-message
          [type]="'error'"
          [title]="'Error alert'"
          [message]="'An error has occurred. Please try again.'"
          [showCloseButton]="true"
        ></alert-message>
        <alert-message
          [type]="'exciting'"
          [title]="'Exciting alert'"
          [message]="'Something great just happened!'"
          [showCloseButton]="true"
        ></alert-message>
      </div>
    `,
  }),
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
};
