import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsTooltipDirective } from '@ds/tooltip/ds-tooltip.directive';
import { DsButtonComponent } from '@ds/button/button.component';

/**
 * # Tooltip — `[dsTooltip]`
 *
 * A **directive** (not a component) powered by Angular CDK Overlay. Apply it to any
 * host element and the tooltip panel is rendered in a CDK overlay portal.
 *
 * **Usage:**
 * ```html
 * <ds-button
 *   [dsTooltipTitle]="'Save changes'"
 *   [dsTooltipContent]="'Saves your work immediately.'"
 *   dsTooltipPosition="above"
 * >
 *   Save
 * </ds-button>
 * ```
 *
 * **Positions:** `auto` (default) | `above` | `above-left` | `above-right` |
 * `below` | `left` | `right`
 *
 * **Hover delay:** 300 ms via RxJS `delay` operator.
 *
 * > ⚠ **Touch devices:** Tooltip uses `mouseenter` / `mouseleave` events and is
 * > **not supported on touch-only devices**. It is strictly a pointer/mouse
 * > interaction pattern.
 *
 * **RTL:** The directive reads `document.dir` at init time — `left` and `right`
 * positions automatically swap offsets in RTL contexts.
 *
 * **Signal inputs:** `tooltipTemplate`, `dsTooltipPosition`, `dsTooltipTitle`,
 * `dsTooltipContent`, `dsTooltipFooter`, `dsTooltipIcon`, `dsTooltipIconClass`,
 * `dsTooltipIconSize`, `dsTooltipEnabled`
 */
const meta: Meta = {
  title: '2. P1 Components/Tooltip',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '`[dsTooltip]` is a **directive** — it is applied to a host element, not used as a component tag. All stories use `render` templates.',
      },
    },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsTooltipDirective, DsButtonComponent] }),
  ],
};

export default meta;
type Story = StoryObj;

/** Simple tooltip with just a content string — hover the button to reveal it. */
export const Default: Story = {
  render: () => ({
    template: `
      <div style="padding:64px;display:flex;justify-content:center;">
        <ds-button
          dsTooltip
          dsTooltipContent="This is a simple tooltip"
          dsTooltipPosition="above"
        >
          Hover me
        </ds-button>
      </div>
    `,
  }),
};

/** Tooltip positioned **above** the trigger element (default arrow points down). */
export const PositionAbove: Story = {
  name: 'Position — Above',
  render: () => ({
    template: `
      <div style="padding:80px;display:flex;justify-content:center;">
        <ds-button
          dsTooltip
          dsTooltipTitle="Above"
          dsTooltipContent="Tooltip appears above the element"
          dsTooltipPosition="above"
        >
          Above
        </ds-button>
      </div>
    `,
  }),
};

/** Tooltip positioned **below** the trigger element (arrow points up). */
export const PositionBelow: Story = {
  name: 'Position — Below',
  render: () => ({
    template: `
      <div style="padding:80px;display:flex;justify-content:center;">
        <ds-button
          dsTooltip
          dsTooltipTitle="Below"
          dsTooltipContent="Tooltip appears below the element"
          dsTooltipPosition="below"
        >
          Below
        </ds-button>
      </div>
    `,
  }),
};

/** Tooltip positioned to the **left** of the trigger element (arrow points right). */
export const PositionLeft: Story = {
  name: 'Position — Left',
  render: () => ({
    template: `
      <div style="padding:80px;display:flex;justify-content:center;">
        <ds-button
          dsTooltip
          dsTooltipTitle="Left"
          dsTooltipContent="Tooltip appears to the left"
          dsTooltipPosition="left"
        >
          Left
        </ds-button>
      </div>
    `,
  }),
};

/** Tooltip positioned to the **right** of the trigger element (arrow points left). */
export const PositionRight: Story = {
  name: 'Position — Right',
  render: () => ({
    template: `
      <div style="padding:80px;display:flex;justify-content:center;">
        <ds-button
          dsTooltip
          dsTooltipTitle="Right"
          dsTooltipContent="Tooltip appears to the right"
          dsTooltipPosition="right"
        >
          Right
        </ds-button>
      </div>
    `,
  }),
};

/**
 * Cross layout showing all six tooltip positions. Hover each button to see the
 * tooltip appear from its respective direction.
 */
export const AllPositions: Story = {
  name: 'All Positions',
  render: () => ({
    template: `
      <div style="display:grid;grid-template-columns:repeat(3,120px);grid-template-rows:repeat(3,80px);gap:8px;padding:80px;place-items:center;">
        <!-- row 1 -->
        <div></div>
        <ds-button
          dsTooltip
          dsTooltipContent="Above"
          dsTooltipPosition="above"
        >
          Above
        </ds-button>
        <div></div>

        <!-- row 2 -->
        <ds-button
          dsTooltip
          dsTooltipContent="Left"
          dsTooltipPosition="left"
        >
          Left
        </ds-button>
        <div style="width:80px;height:80px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#9ca3af;">center</div>
        <ds-button
          dsTooltip
          dsTooltipContent="Right"
          dsTooltipPosition="right"
        >
          Right
        </ds-button>

        <!-- row 3 -->
        <div></div>
        <ds-button
          dsTooltip
          dsTooltipContent="Below"
          dsTooltipPosition="below"
        >
          Below
        </ds-button>
        <div></div>
      </div>
    `,
  }),
  parameters: { layout: 'centered' },
};

/**
 * Tooltip with rich structured content — title, body text, and footer — using the
 * `dsTooltipTitle`, `dsTooltipContent`, and `dsTooltipFooter` inputs together.
 */
export const WithRichContent: Story = {
  name: 'With Rich Content (title + body + footer)',
  render: () => ({
    template: `
      <div style="padding:100px;display:flex;justify-content:center;">
        <ds-button
          dsTooltip
          dsTooltipTitle="Assignment Due"
          dsTooltipContent="Submit your math homework by 8 AM tomorrow. Late submissions will not be accepted."
          dsTooltipFooter="Teacher: Ms. Fatima"
          dsTooltipPosition="above"
        >
          Hover for details
        </ds-button>
      </div>
    `,
  }),
};

/** LTR layout — English tooltip text, standard left-to-right reading. */
export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div style="padding:80px;display:flex;gap:24px;justify-content:center;">
        <ds-button
          dsTooltip
          dsTooltipTitle="Save"
          dsTooltipContent="Save your changes immediately"
          dsTooltipPosition="above"
        >
          Save
        </ds-button>
        <ds-button
          dsTooltip
          dsTooltipTitle="Delete"
          dsTooltipContent="Permanently remove this record"
          dsTooltipPosition="above"
          variant="danger"
        >
          Delete
        </ds-button>
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

/**
 * RTL layout — Arabic tooltip content. The directive reads `document.dir` at init
 * so `left` and `right` positions flip their CDK overlay offsets automatically.
 */
export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div style="padding:80px;display:flex;gap:24px;justify-content:center;direction:rtl;">
        <ds-button
          dsTooltip
          dsTooltipTitle="حفظ"
          dsTooltipContent="احفظ التغييرات فوراً"
          dsTooltipPosition="above"
        >
          حفظ
        </ds-button>
        <ds-button
          dsTooltip
          dsTooltipTitle="حذف"
          dsTooltipContent="إزالة هذا السجل نهائياً"
          dsTooltipPosition="above"
        >
          حذف
        </ds-button>
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
