import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
} from "@storybook/angular";
import { provideIonicAngular } from "@ionic/angular/standalone";
import { DsAccordionComponent } from "@ds/accordion/accordion.component";

/**
 * # Accordion — `ds-accordion`
 *
 * A collapsible panel with an animated CSS-grid expand/collapse transition.
 * Body content is projected via `<ng-content>`. An optional `#accordionActions`
 * named template slot renders in the header (e.g. icon buttons).
 *
 * **When to use:**
 * - FAQs, course details, settings sections, expandable list items
 * - Use `disabled` to prevent interaction without hiding the panel
 *
 * **Animation:** The content area uses `grid-template-rows: 0fr → 1fr` so the
 * body slides open smoothly without JavaScript height calculation.
 */
const meta: Meta<DsAccordionComponent> = {
  title: "1. P0 Components/Accordion",
  component: DsAccordionComponent,
  tags: ["autodocs"],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "Collapsible panel with CSS-grid slide animation. Supports titles, subtitles, tag chips, kebab menu, and arbitrary body content via ng-content.",
      },
    },
  },
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
    expanded: { control: "boolean" },
    disabled: { control: "boolean" },
    showMenu: { control: "boolean" },
    showIcon: { control: "boolean" },
    iconPosition: { control: "select", options: ["start", "end"] },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsAccordionComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsAccordionComponent>;

// ---------------------------------------------------------------------------
// Default — collapsed
// ---------------------------------------------------------------------------
export const Default: Story = {
  args: {
    title: "Test",
    subtitle: "Sub test",
  },

  render: () => ({
    template: `
      <div style="max-width:600px; padding:16px;">
        <ds-accordion title="Course Details" [expanded]="false">
          <div style="padding:16px;">
            <p>This course covers fundamental mathematics concepts for Grade 5 students.</p>
          </div>
        </ds-accordion>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// Expanded
// ---------------------------------------------------------------------------
export const Expanded: Story = {
  parameters: {
    docs: {
      description: { story: "Accordion rendered in the open/expanded state." },
    },
  },
  render: () => ({
    template: `
      <div style="max-width:600px; padding:16px;">
        <ds-accordion title="Course Details" [expanded]="true">
          <div style="padding:16px;">
            <p>This course covers fundamental mathematics concepts for Grade 5 students, including fractions, geometry, and introductory algebra.</p>
          </div>
        </ds-accordion>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// With Subtitle
// ---------------------------------------------------------------------------
export const WithSubtitle: Story = {
  render: () => ({
    template: `
      <div style="max-width:600px; padding:16px;">
        <ds-accordion title="Mathematics — Grade 5" subtitle="3 units · 12 lessons" [expanded]="true">
          <div style="padding:16px;">
            <p>Unit 1: Fractions and Decimals</p>
            <p>Unit 2: Geometry and Shapes</p>
            <p>Unit 3: Introduction to Algebra</p>
          </div>
        </ds-accordion>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// With Tags
// ---------------------------------------------------------------------------
export const WithTags: Story = {
  render: () => ({
    template: `
      <div style="max-width:600px; padding:16px;">
        <ds-accordion
          title="Mathematics — Grade 5"
          [tags]="[{text: 'Math'}, {text: 'Grade 5'}, {text: 'National'}]"
          [expanded]="false"
        >
          <div style="padding:16px;">
            <p>Course content will appear here once expanded.</p>
          </div>
        </ds-accordion>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------
export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Disabled accordion — the header is dimmed and clicking does nothing.",
      },
    },
  },
  render: () => ({
    template: `
      <div style="max-width:600px; padding:16px;">
        <ds-accordion title="Locked Section" subtitle="Complete previous units first" [disabled]="true">
          <div style="padding:16px;">
            <p>This content is not accessible yet.</p>
          </div>
        </ds-accordion>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// With Menu
// ---------------------------------------------------------------------------
export const WithMenu: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Kebab menu visible in the header. `showMenu` must be `true` AND `menuItems` must be non-empty.",
      },
    },
  },
  render: () => ({
    template: `
      <div style="max-width:600px; padding:16px;">
        <ds-accordion
          title="Course Details"
          subtitle="3 units · 12 lessons"
          [showMenu]="true"
          [menuItems]="[{title: 'Edit'}, {title: 'Duplicate'}, {title: 'Delete', state: 'danger'}]"
          [expanded]="false"
        >
          <div style="padding:16px;">
            <p>Course body content projected here.</p>
          </div>
        </ds-accordion>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// Multiple (FAQ style — independent open/close)
// ---------------------------------------------------------------------------
export const Multiple: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Three independent accordions stacked vertically. Each one maintains its own state — expanding one does not collapse the others.",
      },
    },
  },
  render: () => ({
    template: `
      <div style="max-width:600px; padding:16px; display:flex; flex-direction:column; gap:8px;">
        <ds-accordion title="What is the grading policy?" [expanded]="true">
          <div style="padding:16px;">
            <p>Grades are calculated based on assignments (40%), quizzes (30%), and a final exam (30%).</p>
          </div>
        </ds-accordion>

        <ds-accordion title="How do I submit an assignment?" [expanded]="false">
          <div style="padding:16px;">
            <p>Upload your file via the Assignments tab before the due date. Late submissions incur a 10% penalty per day.</p>
          </div>
        </ds-accordion>

        <ds-accordion title="Can I retake a quiz?" [expanded]="false">
          <div style="padding:16px;">
            <p>Quizzes can be retaken once within 24 hours of the original attempt. Only the higher score is recorded.</p>
          </div>
        </ds-accordion>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// Animated (highlights CSS grid transition)
// ---------------------------------------------------------------------------
export const Animated: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Click any header to see the **CSS `grid-template-rows: 0fr → 1fr` animation** — the content slides open and closed without JavaScript height measurement.",
      },
    },
  },
  render: () => ({
    template: `
      <div style="max-width:600px; padding:16px; display:flex; flex-direction:column; gap:8px;">
        <ds-accordion title="Algebra — Week 1" subtitle="4 topics" [expanded]="false">
          <div style="padding:16px;">
            <ul>
              <li>Introduction to variables</li>
              <li>Simple equations</li>
              <li>Order of operations</li>
              <li>Practice problems</li>
            </ul>
          </div>
        </ds-accordion>

        <ds-accordion title="Algebra — Week 2" subtitle="3 topics" [expanded]="false">
          <div style="padding:16px;">
            <ul>
              <li>Inequalities</li>
              <li>Graphing on a number line</li>
              <li>Word problems</li>
            </ul>
          </div>
        </ds-accordion>

        <ds-accordion title="Algebra — Week 3" subtitle="5 topics" [expanded]="false">
          <div style="padding:16px;">
            <ul>
              <li>Systems of equations</li>
              <li>Substitution method</li>
              <li>Elimination method</li>
              <li>Real-world applications</li>
              <li>Review and quiz</li>
            </ul>
          </div>
        </ds-accordion>
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
      <div dir="ltr" style="max-width:600px; padding:16px;">
        <ds-accordion title="Course Details" subtitle="3 units · 12 lessons" [expanded]="true">
          <div style="padding:16px;">
            <p>Course content in a left-to-right layout.</p>
          </div>
        </ds-accordion>
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
      description: { story: "Arabic title in a right-to-left context." },
    },
  },
  render: () => ({
    template: `
      <div dir="rtl" style="max-width:600px; padding:16px;">
        <ds-accordion title="تفاصيل الدرس" subtitle="٣ وحدات · ١٢ درسًا" [expanded]="true">
          <div style="padding:16px; text-align:right;">
            <p>محتوى الدرس سيظهر هنا بعد التوسيع.</p>
          </div>
        </ds-accordion>
      </div>
    `,
  }),
};
