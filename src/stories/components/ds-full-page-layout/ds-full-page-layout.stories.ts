import { Component, input } from '@angular/core';
import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';

@Component({
  selector: 'ds-full-page-layout-mock',
  standalone: true,
  template: `
    <div
      class="layout-container"
      style="display: flex; height: 100vh; width: 100vw; background: #f4f5f7; font-family: 'Nunito', sans-serif; overflow: hidden; position: relative;"
    >
      <!-- Desktop Sidebar -->
      <aside
        class="desktop-sidebar"
        style="width: 260px; background: #1a2238; color: white; display: flex; flex-direction: column; justify-content: space-between; padding: 24px 16px; box-sizing: border-box;"
      >
        <div>
          <!-- Logo / Brand -->
          <div
            style="font-size: 20px; font-weight: 800; color: #fed143; margin-bottom: 32px; display: flex; align-items: center; gap: 8px;"
          >
            <div
              style="width: 32px; height: 32px; background: #fed143; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #1a2238; font-weight: 900;"
            >
              N
            </div>
            <span>NX Portal</span>
          </div>

          <!-- Nav links -->
          <nav style="display: flex; flex-direction: column; gap: 8px;">
            <a
              href="#"
              style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: #2a3554; color: white; text-decoration: none; font-weight: 600; font-size: 14px;"
            >
              <span>🏠</span> Home
            </a>
            <a
              href="#"
              style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; color: #9ca3af; text-decoration: none; font-weight: 600; font-size: 14px;"
              onmouseover="this.style.background='#222c48'; this.style.color='white'"
              onmouseout="this.style.background='transparent'; this.style.color='#9ca3af'"
            >
              <span>📅</span> Attendance
            </a>
            <a
              href="#"
              style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; color: #9ca3af; text-decoration: none; font-weight: 600; font-size: 14px;"
              onmouseover="this.style.background='#222c48'; this.style.color='white'"
              onmouseout="this.style.background='transparent'; this.style.color='#9ca3af'"
            >
              <span>📚</span> Courses
            </a>
            <a
              href="#"
              style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; color: #9ca3af; text-decoration: none; font-weight: 600; font-size: 14px;"
              onmouseover="this.style.background='#222c48'; this.style.color='white'"
              onmouseout="this.style.background='transparent'; this.style.color='#9ca3af'"
            >
              <span>💬</span> Messages
            </a>
          </nav>
        </div>

        <!-- Sidebar Footer -->
        <div
          style="display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid #2e3b5e;"
        >
          <div
            style="width: 40px; height: 40px; border-radius: 50%; background: #fed143; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #1a2238;"
          >
            TA
          </div>
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 13px; font-weight: 600;"
              >Teacher Account</span
            >
            <span style="font-size: 11px; color: #9ca3af;">v1.19.1</span>
          </div>
        </div>
      </aside>

      <!-- Main Panel (Header + Scrollable Content) -->
      <div
        style="flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;"
      >
        <!-- Header -->
        <header
          style="height: 64px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; box-sizing: border-box; z-index: 10;"
        >
          <div style="display: flex; align-items: center; gap: 16px;">
            <button
              class="mobile-menu-btn"
              style="display: none; background: none; border: none; font-size: 20px; cursor: pointer; color: #374151;"
            >
              ☰
            </button>
            <h1
              style="font-size: 18px; font-weight: 700; color: #111827; margin: 0; font-family: 'Nunito', sans-serif;"
            >
              {{ title() }}
            </h1>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 14px; font-weight: 600; color: #4d545a;"
              >Al-Ehsan School</span
            >
            <div
              style="width: 36px; height: 36px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #3b82f6;"
            >
              EN
            </div>
          </div>
        </header>

        <!-- Content Area -->
        <main
          class="content-area"
          style="flex: 1; overflow-y: auto; padding: 24px; box-sizing: border-box; background: var(--colors-brand-35, #f8f9fa);"
        >
          <div
            style="max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;"
          >
            <!-- Breadcrumbs -->
            <div style="font-size: 12px; color: #6b7280; font-weight: 600;">
              Home / Dashboard / Overview
            </div>

            <!-- Page Hero Card -->
            <div
              style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
            >
              <h2
                style="margin-top: 0; font-size: 22px; font-weight: 800; color: #111827;"
              >
                Welcome back, Teacher!
              </h2>
              <p
                style="color: #4d545a; font-size: 15px; line-height: 1.6; margin: 8px 0 0;"
              >
                Here is a summary of your class attendance and updates for
                today. You have 3 submissions pending review.
              </p>
            </div>

            <!-- Grid of Cards -->
            <div
              style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;"
            >
              <div
                style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
              >
                <h3
                  style="margin-top: 0; font-size: 15px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;"
                >
                  Attendance Status
                </h3>
                <div
                  style="font-size: 32px; font-weight: 800; color: #10b981; margin: 8px 0;"
                >
                  94.2%
                </div>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">
                  Average attendance this month
                </p>
              </div>
              <div
                style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
              >
                <h3
                  style="margin-top: 0; font-size: 15px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;"
                >
                  Active Students
                </h3>
                <div
                  style="font-size: 32px; font-weight: 800; color: #3b82f6; margin: 8px 0;"
                >
                  28
                </div>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">
                  Across 2 courses assigned to you
                </p>
              </div>
            </div>
          </div>
        </main>

        <!-- Mobile Bottom Nav Bar -->
        <nav
          class="mobile-bottom-nav"
          style="display: none; height: 64px; background: white; border-top: 1px solid #e5e7eb; justify-content: space-around; align-items: center; position: absolute; bottom: 0; left: 0; right: 0; z-index: 10; box-sizing: border-box;"
        >
          <a
            href="#"
            style="display: flex; flex-direction: column; align-items: center; color: #3b82f6; text-decoration: none; font-size: 10px; font-weight: 700;"
          >
            <span style="font-size: 18px;">🏠</span> Home
          </a>
          <a
            href="#"
            style="display: flex; flex-direction: column; align-items: center; color: #9ca3af; text-decoration: none; font-size: 10px; font-weight: 600;"
          >
            <span style="font-size: 18px;">📅</span> Attendance
          </a>
          <a
            href="#"
            style="display: flex; flex-direction: column; align-items: center; color: #9ca3af; text-decoration: none; font-size: 10px; font-weight: 600;"
          >
            <span style="font-size: 18px;">📚</span> Courses
          </a>
          <a
            href="#"
            style="display: flex; flex-direction: column; align-items: center; color: #9ca3af; text-decoration: none; font-size: 10px; font-weight: 600;"
          >
            <span style="font-size: 18px;">💬</span> Messages
          </a>
        </nav>
      </div>
    </div>

    <!-- Responsive Styles for story context simulation -->
    <style>
      @media (max-width: 840px) {
        .desktop-sidebar {
          display: none !important;
        }
        .mobile-menu-btn {
          display: block !important;
        }
        .mobile-bottom-nav {
          display: flex !important;
        }
        .content-area {
          padding-bottom: 80px !important;
        }
      }
    </style>
  `,
})
export class DsFullPageLayoutMockComponent {
  title = input<string>('Overview Dashboard');
}

/**
 * # Full Page Layout — `ds-app-layout`
 *
 * The primary application page shell container. Handles viewport-specific responsiveness:
 * - **Desktop (841px+)**: Split panel layout with left-hand sidebar navigation, persistent top header, and centered main page container.
 * - **Mobile/Tablet (<840px)**: Collapses sidebar navigation into a bottom tab-bar menu and moves profile actions to a slide-over/hamburger drawer header.
 */
const meta: Meta<DsFullPageLayoutMockComponent> = {
  title: '3. P2 Components/Full Page Layout',
  component: DsFullPageLayoutMockComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [DsFullPageLayoutMockComponent] }),
    componentWrapperDecorator(
      (story) =>
        `<div style="height: 100vh; width: 100vw; margin: 0; padding: 0; overflow: hidden;">${story}</div>`,
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Page title rendered in the mock application shell header.',
    },
  },
};

export default meta;
type Story = StoryObj<DsFullPageLayoutMockComponent>;

export const Default: Story = {
  args: {
    title: 'Overview Dashboard',
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    title: 'Overview Dashboard',
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;height:100%;">${story}</div>`,
    ),
  ],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    title: 'لوحة التحكم العامة',
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;height:100%;">${story}</div>`,
    ),
  ],
  render: (args) => ({
    props: args,
    template: `
      <div class="layout-container" style="display: flex; height: 100vh; width: 100vw; background: #f4f5f7; font-family: 'Lama Rounded', sans-serif; overflow: hidden; position: relative;">
        
        <!-- Desktop Sidebar -->
        <aside class="desktop-sidebar" style="width: 260px; background: #1a2238; color: white; display: flex; flex-direction: column; justify-content: space-between; padding: 24px 16px; box-sizing: border-box;">
          <div>
            <!-- Logo / Brand -->
            <div style="font-size: 20px; font-weight: 800; color: #fed143; margin-bottom: 32px; display: flex; align-items: center; gap: 8px;">
              <div style="width: 32px; height: 32px; background: #fed143; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #1a2238; font-weight: 900;">ن</div>
              <span>نظام إكس</span>
            </div>
            
            <!-- Nav links -->
            <nav style="display: flex; flex-direction: column; gap: 8px;">
              <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: #2a3554; color: white; text-decoration: none; font-weight: 600; font-size: 14px;">
                <span>🏠</span> الرئيسة
              </a>
              <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; color: #9ca3af; text-decoration: none; font-weight: 600; font-size: 14px;">
                <span>📅</span> الحضور والغياب
              </a>
              <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; color: #9ca3af; text-decoration: none; font-weight: 600; font-size: 14px;">
                <span>📚</span> المقررات الدراسية
              </a>
            </nav>
          </div>
          
          <!-- Sidebar Footer -->
          <div style="display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid #2e3b5e;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #fed143; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #1a2238;">مع</div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 13px; font-weight: 600;">حساب المعلم</span>
              <span style="font-size: 11px; color: #9ca3af;">الإصدار 1.19</span>
            </div>
          </div>
        </aside>

        <!-- Main Panel (Header + Scrollable Content) -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;">
          
          <!-- Header -->
          <header style="height: 64px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; box-sizing: border-box; z-index: 10;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <button class="mobile-menu-btn" style="display: none; background: none; border: none; font-size: 20px; cursor: pointer; color: #374151;">☰</button>
              <h1 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0; font-family: 'Lama Rounded', sans-serif;">{{ title }}</h1>
            </div>
            
            <div style="display: flex; align-items: center; gap: 16px;">
              <span style="font-size: 14px; font-weight: 600; color: #4d545a;">مدرسة الإحسان</span>
              <div style="width: 36px; height: 36px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #3b82f6;">AR</div>
            </div>
          </header>

          <!-- Content Area -->
          <main class="content-area" style="flex: 1; overflow-y: auto; padding: 24px; box-sizing: border-box; background: var(--colors-brand-35, #f8f9fa);">
            <div style="max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
              
              <!-- Breadcrumbs -->
              <div style="font-size: 12px; color: #6b7280; font-weight: 600;">
                الرئيسة / لوحة التحكم / نظرة عامة
              </div>

              <!-- Page Hero Card -->
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h2 style="margin-top: 0; font-size: 22px; font-weight: 800; color: #111827;">أهلاً بك مجدداً، يا أستاذ!</h2>
                <p style="color: #4d545a; font-size: 15px; line-height: 1.8; margin: 8px 0 0;">
                  هنا ملخص حضور طلابك والتحديثات لهذا اليوم. لديك 3 طلبات بانتظار المراجعة.
                </p>
              </div>
            </div>
          </main>

          <!-- Mobile Bottom Nav Bar -->
          <nav class="mobile-bottom-nav" style="display: none; height: 64px; background: white; border-top: 1px solid #e5e7eb; justify-content: space-around; align-items: center; position: absolute; bottom: 0; left: 0; right: 0; z-index: 10; box-sizing: border-box;">
            <a href="#" style="display: flex; flex-direction: column; align-items: center; color: #3b82f6; text-decoration: none; font-size: 10px; font-weight: 700;">
              <span style="font-size: 18px;">🏠</span> الرئيسة
            </a>
            <a href="#" style="display: flex; flex-direction: column; align-items: center; color: #9ca3af; text-decoration: none; font-size: 10px; font-weight: 600;">
              <span style="font-size: 18px;">📅</span> الحضور
            </a>
            <a href="#" style="display: flex; flex-direction: column; align-items: center; color: #9ca3af; text-decoration: none; font-size: 10px; font-weight: 600;">
              <span style="font-size: 18px;">📚</span> المقررات
            </a>
          </nav>
        </div>
      </div>

      <style>
        @media (max-width: 840px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-bottom-nav {
            display: flex !important;
          }
          .content-area {
            padding-bottom: 80px !important;
          }
        }
      </style>
    `,
  }),
};
