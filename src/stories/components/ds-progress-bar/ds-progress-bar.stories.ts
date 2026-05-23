import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsProgressBarComponent } from '@ds/progress-bar/progress-bar.component';

/**
 * # Progress Bar — `app-ds-progress-bar`
 *
 * Animated progress indicator with 7 colour variants and 2 sizes.
 * The fill animates from its current value to the target using a
 * cubic-ease-out easing over 800 ms on mount and whenever `progress` changes.
 *
 * **When to use:**
 * - Course completion, attendance rates, assignment scores
 * - Use `lg` (10 px track) for prominent hero metrics
 * - Use `sm` (4 px track) for compact list rows
 *
 * **RTL:** The component calls `isRtl()` internally and flips the
 * percentage label alignment accordingly — no extra work needed.
 */
const meta: Meta<DsProgressBarComponent> = {
  title: '1. P0 Components/Progress Bar',
  component: DsProgressBarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Animated progress bar. 7 variants × 2 sizes. Percentage label is RTL-aware.',
      },
    },
  },
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    variant: {
      control: 'select',
      options: ['green', 'red', 'blue', 'yellow', 'indigo', 'orange', 'neon-green'],
    },
    size: { control: 'select', options: ['sm', 'lg'] },
    showPercentage: { control: 'boolean' },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsProgressBarComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsProgressBarComponent>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------
export const Default: Story = {
  args: {
    progress: 65,
    variant: 'green',
    size: 'lg',
    showPercentage: true,
  },
};

// ---------------------------------------------------------------------------
// All Variants
// ---------------------------------------------------------------------------
export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All 7 colour variants stacked, each at 70% progress.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="max-width:480px; padding:16px; display:flex; flex-direction:column; gap:20px;">
        <div>
          <p style="font-size:12px; color:#666; margin:0 0 6px;">green</p>
          <app-ds-progress-bar [progress]="70" variant="green" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>
        <div>
          <p style="font-size:12px; color:#666; margin:0 0 6px;">red</p>
          <app-ds-progress-bar [progress]="70" variant="red" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>
        <div>
          <p style="font-size:12px; color:#666; margin:0 0 6px;">blue</p>
          <app-ds-progress-bar [progress]="70" variant="blue" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>
        <div>
          <p style="font-size:12px; color:#666; margin:0 0 6px;">yellow</p>
          <app-ds-progress-bar [progress]="70" variant="yellow" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>
        <div>
          <p style="font-size:12px; color:#666; margin:0 0 6px;">indigo</p>
          <app-ds-progress-bar [progress]="70" variant="indigo" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>
        <div>
          <p style="font-size:12px; color:#666; margin:0 0 6px;">orange</p>
          <app-ds-progress-bar [progress]="70" variant="orange" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>
        <div>
          <p style="font-size:12px; color:#666; margin:0 0 6px;">neon-green</p>
          <app-ds-progress-bar [progress]="70" variant="neon-green" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// Size — sm
// ---------------------------------------------------------------------------
export const SizeSm: Story = {
  args: {
    progress: 45,
    variant: 'blue',
    size: 'sm',
    showPercentage: true,
  },
};

// ---------------------------------------------------------------------------
// Size — lg
// ---------------------------------------------------------------------------
export const SizeLg: Story = {
  args: {
    progress: 45,
    variant: 'blue',
    size: 'lg',
    showPercentage: true,
  },
};

// ---------------------------------------------------------------------------
// Show Percentage
// ---------------------------------------------------------------------------
export const ShowPercentage: Story = {
  args: {
    progress: 78,
    variant: 'green',
    size: 'lg',
    showPercentage: true,
  },
};

// ---------------------------------------------------------------------------
// Hide Percentage
// ---------------------------------------------------------------------------
export const HidePercentage: Story = {
  args: {
    progress: 78,
    variant: 'green',
    size: 'lg',
    showPercentage: false,
  },
};

// ---------------------------------------------------------------------------
// Zero Progress
// ---------------------------------------------------------------------------
export const ZeroProgress: Story = {
  args: {
    progress: 0,
    variant: 'red',
    size: 'lg',
    showPercentage: true,
  },
};

// ---------------------------------------------------------------------------
// Full Progress
// ---------------------------------------------------------------------------
export const FullProgress: Story = {
  args: {
    progress: 100,
    variant: 'green',
    size: 'lg',
    showPercentage: true,
  },
};

// ---------------------------------------------------------------------------
// Attendance Example (real-world multi-metric layout)
// ---------------------------------------------------------------------------
export const AttendanceExample: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Real-world example: three progress bars representing Attendance, Grades, and Assignments metrics with colour-coded variants and labels above each bar.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="max-width:480px; padding:24px; display:flex; flex-direction:column; gap:24px; background:#fff; border-radius:12px; border:1px solid #eee;">
        <div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:14px; font-weight:500; color:#1a1a2e;">Attendance</span>
          </div>
          <app-ds-progress-bar [progress]="92" variant="green" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:14px; font-weight:500; color:#1a1a2e;">Grades</span>
          </div>
          <app-ds-progress-bar [progress]="76" variant="blue" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:14px; font-weight:500; color:#1a1a2e;">Assignments</span>
          </div>
          <app-ds-progress-bar [progress]="58" variant="orange" size="lg" [showPercentage]="true"></app-ds-progress-bar>
        </div>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// LTR
// ---------------------------------------------------------------------------
export const LTR: Story = {
  render: () => ({
    template: `
      <div dir="ltr" style="max-width:400px; padding:16px;">
        <app-ds-progress-bar [progress]="72" variant="green" size="lg" [showPercentage]="true"></app-ds-progress-bar>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// RTL
// ---------------------------------------------------------------------------
export const RTL: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Right-to-left layout. The component uses `isRtl()` internally — the percentage label aligns to the left in RTL mode.',
      },
    },
  },
  render: () => ({
    template: `
      <div dir="rtl" style="max-width:400px; padding:16px;">
        <app-ds-progress-bar [progress]="72" variant="green" size="lg" [showPercentage]="true"></app-ds-progress-bar>
      </div>
    `,
  }),
};
