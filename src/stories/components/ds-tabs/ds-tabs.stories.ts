import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { expect } from 'storybook/test';
import { DsTabsComponent } from '@ds/tabs/tabs.component';
import { DsTabsWithSwipeComponent } from '@ds/tabs/tabs-with-swipe.component';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';

/**
 * Passthrough translation provider — returns the key as-is.
 * Required because `DsTabsComponent` imports `DsTranslatePipe` internally.
 */
const passthroughTranslation = {
  translate: (key: string) => key,
  getActiveLang: () => 'en',
};

/**
 * # Tabs — `app-ds-tabs`
 *
 * Horizontal navigation component for switching between related content views.
 * Supports scrollable overflow with left/right navigation arrows, badge counts,
 * and disabled tab states. Fully RTL-aware. Used 21+ times.
 *
 * **When to use:** Switching between 2–7 related views on the same page.
 * **When NOT to use:** Global navigation → use sidebar/bottom-nav. Only 1 section → omit tabs.
 *
 * **Variants:**
 * - `primary` — filled active tab with brand colour background
 * - `secondary` — white background with bordered active indicator
 *
 * **Key inputs:**
 * - `tabs: Tab[]` — `{ id, label, badge?, disabled? }`
 * - `activeTabId` — initially selected tab
 * - `variant` — `'primary'` | `'secondary'`
 * - `scrollable` — `'auto'` (default) | `true` | `false`
 * - `showNavigationArrows` — show left/right scroll buttons when overflowing
 *
 * **Output:** `tabChange` emits the selected tab `id`.
 *
 * **Scrollable behaviour:** When `scrollable='auto'`, the component uses a
 * `ResizeObserver` to detect overflow and enables arrows automatically. On mobile
 * (`isMobile()=true`) arrows appear whenever there is any overflow; on desktop a
 * threshold check applies.
 *
 * **Important:** `DS_TRANSLATION_TOKEN` must be provided — the component uses
 * `DsTranslatePipe` internally for accessibility labels.
 */
const meta: Meta<DsTabsComponent> = {
  title: '1. P0 Components/Tabs',
  component: DsTabsComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Horizontal tab navigation with scrollable overflow, badge counts, disabled states, and RTL support. Provide DS_TRANSLATION_TOKEN — the component uses DsTranslatePipe internally.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Visual style of the active tab indicator',
    },
    scrollable: {
      control: 'select',
      options: ['auto', true, false],
      description:
        '"auto" detects overflow via ResizeObserver; true/false force the state',
    },
    showNavigationArrows: {
      control: 'boolean',
      description: 'Show left/right arrow buttons when tabs overflow',
    },
  },
  decorators: [
    applicationConfig({
      providers: [
        provideIonicAngular(),
        { provide: DS_TRANSLATION_TOKEN, useValue: passthroughTranslation },
      ],
    }),
    moduleMetadata({ imports: [DsTabsComponent, DsTabsWithSwipeComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="padding:16px;max-width:480px;">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsTabsComponent>;

// ─── Shared data sets ─────────────────────────────────────────────────────────

const sampleTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'grades', label: 'Grades' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'assignments', label: 'Assignments' },
];

const manyTabs = [
  { id: 't1', label: 'Overview' },
  { id: 't2', label: 'Grades' },
  { id: 't3', label: 'Attendance' },
  { id: 't4', label: 'Assignments' },
  { id: 't5', label: 'Schedule' },
  { id: 't6', label: 'Reports' },
  { id: 't7', label: 'Documents' },
];

// ─── Primary ─────────────────────────────────────────────────────────────────

export const Primary: Story = {
  name: 'Variant: primary',
  parameters: {
    docs: {
      description: {
        story:
          '`variant="primary"` — filled active tab with the brand colour background. The default and most common variant.',
      },
    },
  },
  args: {
    tabs: sampleTabs,
    activeTabId: 'overview',
    variant: 'primary',
    scrollable: 'auto',
    showNavigationArrows: true,
  },
};

// ─── Secondary ───────────────────────────────────────────────────────────────

export const Secondary: Story = {
  name: 'Variant: secondary',
  parameters: {
    docs: {
      description: {
        story:
          '`variant="secondary"` — white background with a border/underline active indicator. Use on light card or panel surfaces to avoid double backgrounds.',
      },
    },
  },
  args: {
    tabs: sampleTabs,
    activeTabId: 'overview',
    variant: 'secondary',
    scrollable: 'auto',
    showNavigationArrows: true,
  },
};

// ─── With Badges ─────────────────────────────────────────────────────────────

export const WithBadges: Story = {
  name: 'With badges',
  parameters: {
    docs: {
      description: {
        story:
          'Add a `badge` number to any `Tab` object to show a notification count pill. Useful for unread items, pending actions, or counts.',
      },
    },
  },
  args: {
    tabs: [
      { id: 'all', label: 'All' },
      { id: 'pending', label: 'Pending', badge: 5 },
      { id: 'graded', label: 'Graded', badge: 12 },
      { id: 'missed', label: 'Missed', badge: 2 },
    ],
    activeTabId: 'pending',
    variant: 'primary',
    scrollable: 'auto',
    showNavigationArrows: true,
  },
};

// ─── With Disabled ───────────────────────────────────────────────────────────

export const WithDisabled: Story = {
  name: 'With disabled tab',
  parameters: {
    docs: {
      description: {
        story:
          '`disabled: true` on a `Tab` object prevents selection and applies muted styling. `onTabClick` returns early for disabled tabs.',
      },
    },
  },
  args: {
    tabs: [
      { id: 'active', label: 'Active' },
      { id: 'archived', label: 'Archived' },
      { id: 'locked', label: 'Locked', disabled: true },
      { id: 'restricted', label: 'Restricted', disabled: true },
    ],
    activeTabId: 'active',
    variant: 'primary',
    scrollable: 'auto',
    showNavigationArrows: true,
  },
};

// ─── Scrollable ───────────────────────────────────────────────────────────────

export const Scrollable: Story = {
  name: 'Scrollable (7 tabs, narrow)',
  parameters: {
    docs: {
      description: {
        story:
          '7 tabs in a 320px container force overflow. `scrollable=true` + `showNavigationArrows=true` reveals left/right arrow buttons. The `ResizeObserver` recalculates on every container resize.',
      },
    },
  },
  args: {
    tabs: manyTabs,
    activeTabId: 't1',
    variant: 'primary',
    scrollable: true,
    showNavigationArrows: true,
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="padding:16px;max-width:320px;">${story}</div>`,
    ),
  ],
};

// ─── Mobile Scroll Arrows ─────────────────────────────────────────────────────

export const MobileScrollArrows: Story = {
  name: 'Mobile scroll arrows',
  parameters: {
    docs: {
      description: {
        story: `
When **running on a mobile device** (\`isMobile()=true\`), the tabs component detects
overflow automatically and shows navigation arrows as soon as any tab overflows the
container — even without explicit \`scrollable=true\`.

Arrow visibility is driven by two computed signals:
- \`canScrollLeft\` — \`scrollPosition > 1\`
- \`canScrollRight\` — \`scrollPosition < maxScrollPosition - 1\`

Each arrow click scrolls the container by **50% of its visible width** with
\`behavior: 'smooth'\`. RTL scroll direction is handled automatically.

> **To simulate mobile in Storybook:** Open the Device Toolbar (⌘+Shift+M) and select
> a mobile preset. The \`isMobile()\` utility reads the User-Agent, so using the
> Device Toolbar is required for the mobile code path to activate.

This story uses a 300px container with 7 tabs to force overflow in any viewport.
        `,
      },
    },
  },
  args: {
    tabs: manyTabs,
    activeTabId: 't1',
    variant: 'primary',
    scrollable: true,
    showNavigationArrows: true,
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="padding:16px;max-width:300px;">${story}</div>`,
    ),
  ],
};

// ─── Loading ─────────────────────────────────────────────────────────────────

export const Loading: Story = {
  name: 'State: Loading skeleton',
  parameters: {
    docs: {
      description: {
        story:
          '`ds-tabs-with-swipe` loading state renders the production skeleton instead of tab panel content.',
      },
    },
  },
  render: () => ({
    props: {
      tabs: sampleTabs,
    },
    template: `
      <ds-tabs-with-swipe
        [tabs]="tabs"
        [activeTabId]="'overview'"
        [isLoading]="true"
        contentClass="min-h-[180px]"
      >
        <ng-template #content let-tabId>
          <div class="p-ds-lg">Loaded content: {{ tabId }}</div>
        </ng-template>
      </ds-tabs-with-swipe>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.animate-pulse')).toBeTruthy();
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  parameters: {
    docs: {
      description: {
        story:
          'Left-to-right layout with English labels. The active tab indicator and scroll arrows are positioned for LTR reading direction.',
      },
    },
  },
  args: {
    tabs: sampleTabs,
    activeTabId: 'grades',
    variant: 'primary',
    scrollable: 'auto',
    showNavigationArrows: true,
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;max-width:480px;">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  parameters: {
    docs: {
      description: {
        story:
          'Right-to-left layout with Arabic tab labels. The `isRtl` flag inverts scroll direction: left arrow scrolls visually left (RTL), right arrow scrolls visually right. Badge counts and disabled states are fully supported in RTL.',
      },
    },
  },
  args: {
    tabs: [
      { id: 'overview', label: 'نظرة عامة' },
      { id: 'grades', label: 'الدرجات', badge: 3 },
      { id: 'attendance', label: 'الحضور' },
      { id: 'assignments', label: 'الواجبات', badge: 7 },
    ],
    activeTabId: 'grades',
    variant: 'primary',
    scrollable: 'auto',
    showNavigationArrows: true,
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:16px;max-width:480px;">${story}</div>`,
    ),
  ],
};
