import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { NotificationContainerComponent } from '@ds/in-app-notification/notification-container.component';
import { NotificationService } from '@ds/in-app-notification/notification.service';
import { InAppNotificationCardComponent } from '@ds/in-app-notification/in-app-notification-card.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { DeepLinkService } from '@core/services/deep-link.service';
import { NotificationDestination } from '@shared/enums';

type NotificationScenario = 'default' | 'stacked' | 'rtl' | 'error';

@Component({
  selector: 'story-notification-launcher',
  standalone: true,
  imports: [DsButtonComponent, NotificationContainerComponent],
  template: `
    <div class="relative min-h-[420px] bg-surface-secondary-light p-ds-xl">
      <div class="flex flex-wrap gap-ds-md">
        <ds-button
          variant="primary"
          size="lg"
          (click)="
            scenario === 'stacked' ? showStack() : showNotification()
          "
        >
          {{ scenario === 'stacked' ? 'Show stack' : 'Show notification' }}
        </ds-button>
        <ds-button variant="secondary" size="lg" (click)="clear()">
          Clear notifications
        </ds-button>
      </div>
      <ds-app-notification-container />
    </div>
  `,
})
class StoryNotificationLauncherComponent {
  @Input() scenario: NotificationScenario = 'default';

  private readonly notificationService = inject(NotificationService);

  showNotification(): void {
    this.notificationService.show({
      title:
        this.scenario === 'rtl'
          ? 'تم نشر الواجب'
          : this.scenario === 'error'
            ? 'Navigation error fallback'
          : 'Assignment published',
      message:
        this.scenario === 'rtl'
          ? 'تم إرسال واجب الرياضيات إلى الطلاب.'
          : this.scenario === 'error'
            ? 'Clicking this card exercises the fallback route.'
          : 'Math homework is now visible to students.',
      duration: 0,
      destination:
        this.scenario === 'error'
          ? NotificationDestination.COURSE_CONTENT_LIST_STUDENT
          : undefined,
    });
  }

  showStack(): void {
    for (let index = 1; index <= 6; index += 1) {
      this.notificationService.show({
        title: `Notification ${index}`,
        message: `Newest notifications stay on top. Item ${index}.`,
        duration: 0,
      });
    }
  }

  clear(): void {
    this.notificationService.clear();
  }
}

const fallbackRoutes: unknown[][] = [];

const routerFake: Partial<Router> = {
  navigate: (commands: unknown[]) => {
    fallbackRoutes.push(commands);
    return Promise.resolve(true);
  },
};

const deepLinkFake: Partial<DeepLinkService> = {
  handleNotificationClick: () => {
    throw new globalThis.Error('Story navigation failure');
  },
  navigateToDestination: () => undefined,
};

/**
 * # In-App Notification
 *
 * Service-backed notification stack. Stories call `NotificationService.show()`
 * and render the production notification container/card path.
 */
const meta: Meta<NotificationContainerComponent> = {
  title: '2. P1 Components/In-App Notification',
  component: NotificationContainerComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile' },
    docs: {
      description: {
        component:
          'Fixed in-app notification stack backed by NotificationService. Cards dismiss on click/swipe and can navigate through DeepLinkService when a destination is present.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  argTypes: {},
  decorators: [
    withHessaProviders({ animations: 'browser', lottie: true }),
    moduleMetadata({
      imports: [
        NotificationContainerComponent,
        InAppNotificationCardComponent,
        StoryNotificationLauncherComponent,
      ],
      providers: [
        { provide: Router, useValue: routerFake },
        { provide: DeepLinkService, useValue: deepLinkFake },
      ],
    }),
    componentWrapperDecorator(
      (story) => `<div class="w-[390px] max-w-full">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<NotificationContainerComponent>;

const renderLauncher = (scenario: NotificationScenario = 'default') => ({
  props: { scenario },
  template: `<story-notification-launcher [scenario]="scenario" />`,
});

export const Default: Story = {
  render: () => renderLauncher('default'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Show notification' }),
    );
    await expect(
      await canvas.findByText('Assignment published'),
    ).toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear notifications' }),
    );
    await expect(canvas.queryByText('Assignment published')).not.toBeInTheDocument();
  },
};

export const DismissOnClick: Story = {
  name: 'Dismiss on card click',
  render: () => renderLauncher('default'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Show notification' }),
    );
    await userEvent.click(await canvas.findByText('Assignment published'));
    await expect(canvas.queryByText('Assignment published')).not.toBeInTheDocument();
  },
};

export const Stacked: Story = {
  render: () => renderLauncher('stacked'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Show stack' }));
    await expect(await canvas.findByText('Notification 6')).toBeInTheDocument();
    await expect(canvas.queryByText('Notification 1')).not.toBeInTheDocument();
  },
};

export const Error: Story = {
  name: 'Error fallback navigation',
  render: () => renderLauncher('error'),
  play: async ({ canvasElement }) => {
    fallbackRoutes.length = 0;
    const originalConsoleError = console.error;
    console.error = () => undefined;

    try {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole('button', { name: 'Show notification' }),
      );
      await userEvent.click(
        await canvas.findByText('Navigation error fallback'),
      );

      await expect(fallbackRoutes).toEqual([['/home']]);
      await expect(
        canvas.queryByText('Navigation error fallback'),
      ).not.toBeInTheDocument();
    } finally {
      console.error = originalConsoleError;
    }
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => renderLauncher('default'),
  decorators: [withHessaProviders({ locale: 'en', lottie: true })],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => renderLauncher('rtl'),
  decorators: [
    withHessaProviders({ locale: 'ar', lottie: true }),
    componentWrapperDecorator(
      (story) =>
        `<div class="w-[390px] max-w-full" lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Show notification' }),
    );
    await expect(await canvas.findByText('تم نشر الواجب')).toBeInTheDocument();
  },
};
