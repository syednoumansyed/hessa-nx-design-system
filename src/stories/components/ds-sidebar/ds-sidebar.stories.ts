import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { Component, inject, Input } from '@angular/core';
import { IonApp } from '@ionic/angular/standalone';
import { expect, userEvent, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsSidebarComponent } from '@ds/sidebar/sidebar.component';
import { DsSidebarService } from '@ds/sidebar/sidebar.service';
import { ModalSheetContainerComponent } from '@ds/modal-sheet/modal-sheet-container.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsFeedbackComponent } from '@ds/feedback/feedback.component';
import { DsInputComponent } from '@ds/input/input.component';

type SidebarScenario = 'desktop' | 'mobile-sheet';

@Component({
  selector: 'story-sidebar-service-content',
  standalone: true,
  imports: [DsFeedbackComponent, DsInputComponent],
  template: `
    <div class="flex flex-col gap-ds-xl">
      <ds-feedback
        type="success"
        title="Sidebar service content"
        message="DsSidebarService.open() projected this standalone component into the active presentation path."
      />
      <app-ds-input
        label="Student note"
        inputValue="Ready for review"
        placeholder="Add note"
      />
    </div>
  `,
})
class StorySidebarServiceContentComponent {}

@Component({
  selector: 'story-sidebar-service-launcher',
  standalone: true,
  imports: [IonApp, DsButtonComponent, ModalSheetContainerComponent],
  template: `
    <ion-app>
      <div class="flex h-full flex-col justify-end bg-surface-secondary-light p-ds-xl">
        <p class="content-sm-default mb-ds-md text-content-mid">
          Opens through DsSidebarService using the selected runtime branch.
        </p>
        <ds-button
          variant="primary"
          size="lg"
          [fullWidth]="true"
          (click)="openSidebar()"
        >
          Open service sidebar
        </ds-button>
      </div>
      <ds-modal-sheet-container />
    </ion-app>
  `,
})
class StorySidebarServiceLauncherComponent {
  @Input() scenario: SidebarScenario = 'desktop';

  private readonly sidebarService = inject(DsSidebarService);

  async openSidebar(): Promise<void> {
    await this.sidebarService.open({
      component: StorySidebarServiceContentComponent,
      headerConfig: {
        title:
          this.scenario === 'mobile-sheet'
            ? 'Mobile Sheet Sidebar'
            : 'Desktop Sidebar',
        subtitle:
          this.scenario === 'mobile-sheet'
            ? 'Routed through ModalSheetService'
            : 'Routed through Ionic ModalController',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Save changes' },
        secondaryButton: { text: 'Cancel' },
        fullWidthButtons: true,
        buttonSize: 'lg',
      },
      contentClass: 'p-ds-xl',
      scrollableContent: true,
      mobilePresentation:
        this.scenario === 'mobile-sheet' ? 'modal-sheet' : 'bottom-sheet',
      backdropDismiss: true,
    });
  }
}

/**
 * # Sidebar - `ds-sidebar`
 *
 * Structured side-panel shell and service-backed drawer flow. Direct stories
 * inspect the shell; service stories open the production runtime paths.
 */
const meta: Meta<DsSidebarComponent> = {
  title: '2. P1 Components/Sidebar',
  component: DsSidebarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sidebar shell with header, scrollable body, and footer actions. DsSidebarService uses an Ionic modal sidebar on desktop and can route mobile modal-sheet presentation through ModalSheetService.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  argTypes: {
    headerConfig: { control: 'object' },
    footerConfig: { control: 'object' },
    contentClass: { control: 'text' },
    scrollableContent: { control: 'boolean' },
  },
  decorators: [
    withHessaProviders({ mobile: false, layout: true }),
    moduleMetadata({
      imports: [
        DsSidebarComponent,
        StorySidebarServiceLauncherComponent,
        StorySidebarServiceContentComponent,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<DsSidebarComponent>;

const shellTemplate = (body: string, footer = true) => `
  <div class="flex h-screen justify-end bg-surface-secondary-light">
    <div class="flex h-full w-[400px] max-w-full bg-surface-primary shadow-lg">
      <ds-sidebar
        [headerConfig]="{
          title: 'Student Details',
          subtitle: 'Review current profile data',
          showCloseButton: true,
          showBackButton: false
        }"
        ${
          footer
            ? `[footerConfig]="{
                primaryButton: { text: 'Save' },
                secondaryButton: { text: 'Cancel' },
                buttonSize: 'md',
                fullWidthButtons: true
              }"`
            : ''
        }
      >
        ${body}
      </ds-sidebar>
    </div>
  </div>
`;

export const Default: Story = {
  render: () => ({
    template: shellTemplate(`
      <div class="flex flex-col gap-ds-md">
        <p class="content-md-default text-content-high">
          Ahmed Al-Rashid
        </p>
        <p class="content-sm-default text-content-mid">
          Grade 5-A · STU-20240042 · Active
        </p>
      </div>
    `),
  }),
};

export const Disabled: Story = {
  name: 'State: Disabled footer actions',
  render: () => ({
    template: `
      <div class="flex h-screen justify-end bg-surface-secondary-light">
        <div class="flex h-full w-[400px] max-w-full bg-surface-primary shadow-lg">
          <ds-sidebar
            [headerConfig]="{
              title: 'Student Details',
              subtitle: 'Actions disabled while permissions are checked',
              showCloseButton: true
            }"
            [footerConfig]="{
              primaryButton: { text: 'Save', disabled: true },
              secondaryButton: { text: 'Cancel', disabled: true },
              buttonSize: 'md',
              fullWidthButtons: true
            }"
          >
            <p class="content-sm-default text-content-mid">
              The panel is visible, but footer actions are blocked.
            </p>
          </ds-sidebar>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  },
};

export const Loading: Story = {
  name: 'State: Loading primary action',
  render: () => ({
    template: `
      <div class="flex h-screen justify-end bg-surface-secondary-light">
        <div class="flex h-full w-[400px] max-w-full bg-surface-primary shadow-lg">
          <ds-sidebar
            [headerConfig]="{
              title: 'Saving Changes',
              subtitle: 'Primary footer action is in progress',
              showCloseButton: true
            }"
            [footerConfig]="{
              primaryButton: { text: 'Saving', loading: true },
              secondaryButton: { text: 'Cancel', disabled: true },
              buttonSize: 'md',
              fullWidthButtons: true
            }"
          >
            <p class="content-sm-default text-content-mid">
              The sidebar remains readable while the primary action is loading.
            </p>
          </ds-sidebar>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Saving' })).toBeDisabled();
  },
};

export const NoFooter: Story = {
  name: 'No footer',
  render: () => ({
    template: shellTemplate(
      `
        <div class="flex flex-col gap-ds-md">
          <p class="content-md-default text-content-high">Notifications</p>
          <p class="content-sm-default text-content-mid">
            Read-only sidebar content does not need footer actions.
          </p>
        </div>
      `,
      false,
    ),
  }),
};

export const DesktopServicePath: Story = {
  name: 'Service path: desktop sidebar',
  render: () => ({
    props: { scenario: 'desktop' satisfies SidebarScenario },
    template: `<story-sidebar-service-launcher [scenario]="scenario" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open service sidebar' }),
    );

    const body = within(document.body);
    await expect(
      await body.findByText('Sidebar service content'),
    ).toBeInTheDocument();
    await expect(await body.findByText('Desktop Sidebar')).toBeInTheDocument();
  },
};

export const MobileModalSheetServicePath: Story = {
  name: 'Service path: mobile modal sheet',
  render: () => ({
    props: { scenario: 'mobile-sheet' satisfies SidebarScenario },
    template: `<story-sidebar-service-launcher [scenario]="scenario" />`,
  }),
  decorators: [
    withHessaProviders({ mobile: true, layout: true }),
    componentWrapperDecorator(
      (story) =>
        `<div class="relative mx-auto h-[667px] w-[375px] overflow-hidden rounded-ds-2xl border-2 border-stroke-mid bg-surface-secondary-light">${story}</div>`,
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open service sidebar' }),
    );

    await expect(
      await canvas.findByText('Sidebar service content'),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByText('Mobile Sheet Sidebar'),
    ).toBeInTheDocument();
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div lang="en" dir="ltr">
        ${shellTemplate(`
          <p class="content-sm-default text-content-mid">
            Left-to-right sidebar header and footer layout.
          </p>
        `)}
      </div>
    `,
  }),
  decorators: [withHessaProviders({ mobile: false, layout: true, locale: 'en' })],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div lang="ar" dir="rtl">
        <div class="flex h-screen justify-start bg-surface-secondary-light">
          <div class="flex h-full w-[400px] max-w-full bg-surface-primary shadow-lg">
            <ds-sidebar
              [headerConfig]="{
                title: 'تفاصيل الطالب',
                subtitle: 'مراجعة بيانات الملف',
                showCloseButton: true
              }"
              [footerConfig]="{
                primaryButton: { text: 'حفظ' },
                secondaryButton: { text: 'إلغاء' },
                buttonSize: 'md',
                fullWidthButtons: true
              }"
            >
              <p class="content-sm-default text-content-mid">
                تخطيط الشريط الجانبي من اليمين إلى اليسار.
              </p>
            </ds-sidebar>
          </div>
        </div>
      </div>
    `,
  }),
  decorators: [withHessaProviders({ mobile: false, layout: true, locale: 'ar' })],
};
