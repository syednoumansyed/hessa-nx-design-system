import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsSidebarComponent } from '@ds/sidebar/sidebar.component';

/**
 * # Sidebar — `ds-sidebar`
 *
 * A panel shell for slide-over / drawer UI. Structurally identical to the modal
 * but designed for persistent side-panel contexts.
 *
 * - Header via `headerConfig` (`DsModalHeaderConfig`) — title, subtitle, back/close buttons
 * - Body via `<ng-content>` — fully custom
 * - Footer via `footerConfig` (`DsModalFooterConfig`) — primary & secondary action buttons
 * - `scrollableContent` (default `true`) — body scrolls independently while header & footer stick
 * - `contentClass` — custom CSS class for the body wrapper (default `p-ds-xl`)
 *
 * In production the sidebar is opened via `DsSidebarService`. In Storybook the shell
 * is rendered directly inside a fixed-size container to simulate the panel appearance.
 */
const meta: Meta<DsSidebarComponent> = {
  title: '2. P1 Components/Sidebar',
  component: DsSidebarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsSidebarComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsSidebarComponent>;

/** Full sidebar — header with close button, body content, primary + secondary footer buttons. */
export const Default: Story = {
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;height:100vh;background:#f3f4f6;">
        <div style="width:400px;height:100%;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.10);display:flex;flex-direction:column;">
          <ds-sidebar
            [headerConfig]="{
              title: 'Student Details',
              showCloseButton: true,
              showBackButton: false
            }"
            [footerConfig]="{
              primaryButton: { text: 'Save' },
              secondaryButton: { text: 'Cancel' },
              buttonSize: 'md'
            }"
          >
            <div style="display:flex;flex-direction:column;gap:16px;color:#374151;">
              <p style="margin:0;"><strong>Name:</strong> Ahmed Al-Rashid</p>
              <p style="margin:0;"><strong>Grade:</strong> 5-A</p>
              <p style="margin:0;"><strong>Student ID:</strong> STU-20240042</p>
              <p style="margin:0;"><strong>Status:</strong> Active</p>
            </div>
          </ds-sidebar>
        </div>
      </div>
    `,
  }),
};

/** Header includes an optional subtitle for extra context below the title. */
export const WithSubtitle: Story = {
  name: 'With Subtitle',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;height:100vh;background:#f3f4f6;">
        <div style="width:400px;height:100%;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.10);display:flex;flex-direction:column;">
          <ds-sidebar
            [headerConfig]="{
              title: 'Add Subject',
              subtitle: 'Choose from available subjects below',
              showCloseButton: true,
              showBackButton: false
            }"
            [footerConfig]="{
              primaryButton: { text: 'Add Subject' },
              secondaryButton: { text: 'Cancel' },
              buttonSize: 'md'
            }"
          >
            <div style="display:flex;flex-direction:column;gap:12px;color:#374151;">
              <p style="margin:0;">Select a subject to add to this student's curriculum.</p>
              <ul style="margin:0;padding-left:20px;">
                <li>Mathematics</li>
                <li>Science</li>
                <li>English</li>
                <li>Arabic</li>
              </ul>
            </div>
          </ds-sidebar>
        </div>
      </div>
    `,
  }),
};

/** No footer — header and body only. Useful for read-only detail panels. */
export const NoFooter: Story = {
  name: 'No Footer',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;height:100vh;background:#f3f4f6;">
        <div style="width:400px;height:100%;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.10);display:flex;flex-direction:column;">
          <ds-sidebar
            [headerConfig]="{
              title: 'Notifications',
              showCloseButton: true,
              showBackButton: false
            }"
          >
            <div style="display:flex;flex-direction:column;gap:16px;color:#374151;">
              <div style="padding:12px;background:#f9fafb;border-radius:8px;">
                <p style="margin:0;font-weight:600;">Assignment Due</p>
                <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Math homework due tomorrow at 8 AM.</p>
              </div>
              <div style="padding:12px;background:#f9fafb;border-radius:8px;">
                <p style="margin:0;font-weight:600;">Attendance Alert</p>
                <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Student was absent on Monday.</p>
              </div>
            </div>
          </ds-sidebar>
        </div>
      </div>
    `,
  }),
};

/**
 * Long body content with `scrollableContent=true` — the body scrolls while the
 * header and footer remain fixed (sticky).
 */
export const ScrollableContent: Story = {
  name: 'Scrollable Content',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;height:100vh;background:#f3f4f6;">
        <div style="width:400px;height:100%;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.10);display:flex;flex-direction:column;">
          <ds-sidebar
            [scrollableContent]="true"
            [headerConfig]="{
              title: 'Full Report',
              showCloseButton: true,
              showBackButton: false
            }"
            [footerConfig]="{
              primaryButton: { text: 'Export PDF' },
              secondaryButton: { text: 'Close' },
              buttonSize: 'md'
            }"
          >
            <div style="color:#374151;line-height:1.7;display:flex;flex-direction:column;gap:16px;">
              <p style="margin:0;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vehicula libero vel enim vestibulum, nec feugiat lorem suscipit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>
              <p style="margin:0;">Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.</p>
              <p style="margin:0;">Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper.</p>
              <p style="margin:0;">Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum.</p>
              <p style="margin:0;">Integer in mauris eu nibh euismod gravida dui. Duis orci. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus. Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus.</p>
            </div>
          </ds-sidebar>
        </div>
      </div>
    `,
  }),
};

/** Back button shown in the header — for multi-step sidebar flows. */
export const WithBackButton: Story = {
  name: 'With Back Button',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;height:100vh;background:#f3f4f6;">
        <div style="width:400px;height:100%;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.10);display:flex;flex-direction:column;">
          <ds-sidebar
            [headerConfig]="{
              title: 'Step 2 of 3 — Assign Teacher',
              showBackButton: true,
              showCloseButton: true
            }"
            [footerConfig]="{
              primaryButton: { text: 'Continue' },
              secondaryButton: { text: 'Back' },
              buttonSize: 'md'
            }"
          >
            <div style="color:#374151;">
              <p style="margin:0 0 16px;">Select a teacher to assign to this class.</p>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                  <input type="radio" name="teacher" value="1" /> Ms. Fatima Al-Nasser
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                  <input type="radio" name="teacher" value="2" /> Mr. Khalid Ibrahim
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                  <input type="radio" name="teacher" value="3" /> Dr. Aisha Mahmoud
                </label>
              </div>
            </div>
          </ds-sidebar>
        </div>
      </div>
    `,
  }),
};

/** LTR layout — English content, left-to-right text direction. */
export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;height:100vh;background:#f3f4f6;">
        <div style="width:400px;height:100%;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.10);display:flex;flex-direction:column;">
          <ds-sidebar
            [headerConfig]="{
              title: 'Filters',
              showCloseButton: true,
              showBackButton: false
            }"
            [footerConfig]="{
              primaryButton: { text: 'Apply Filters' },
              secondaryButton: { text: 'Reset' },
              buttonSize: 'md'
            }"
          >
            <p style="margin:0;color:#374151;">Filter options go here.</p>
          </ds-sidebar>
        </div>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;">${story}</div>`,
    ),
  ],
};

/** RTL layout — Arabic content, right-to-left text direction. */
export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-start;height:100vh;background:#f3f4f6;">
        <div style="width:400px;height:100%;background:#fff;box-shadow:4px 0 24px rgba(0,0,0,.10);display:flex;flex-direction:column;">
          <ds-sidebar
            [headerConfig]="{
              title: 'تفاصيل الطالب',
              showCloseButton: true,
              showBackButton: false
            }"
            [footerConfig]="{
              primaryButton: { text: 'حفظ' },
              secondaryButton: { text: 'إلغاء' },
              buttonSize: 'md'
            }"
          >
            <div style="display:flex;flex-direction:column;gap:16px;color:#374151;">
              <p style="margin:0;"><strong>الاسم:</strong> أحمد الراشد</p>
              <p style="margin:0;"><strong>الصف:</strong> الخامس أ</p>
              <p style="margin:0;"><strong>رقم الطالب:</strong> STU-20240042</p>
            </div>
          </ds-sidebar>
        </div>
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;">${story}</div>`,
    ),
  ],
};
