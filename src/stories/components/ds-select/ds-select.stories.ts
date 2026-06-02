import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { NEVER } from 'rxjs';
import { DsSelectComponent } from '@ds/select/select.component';
import { DsSelectConfig } from '@ds/select/select.interface';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

/**
 * # Select — `app-ds-select`
 *
 * Searchable dropdown for single or multi-select. On **mobile**, opens as an
 * `IonModal` (full-screen sheet); on **desktop**, uses a CDK overlay panel.
 * Supports infinite-scroll pagination for large server-side datasets.
 * Used 37+ times across the app.
 *
 * **When to use:** 5+ options, especially with search or paginated server data.
 * **When NOT to use:** 2–4 options → use `ds-radio-group`. Small list with visual icons → use chip-selector.
 *
 * **Key config properties (`DsSelectConfig`):**
 * - `options` — static array of `{ id, display, disabled? }`
 * - `isMultiple` — multi-select mode; shows chips for selections
 * - `showSearch` — enable/disable search input (default: `true`)
 * - `showSelectAll` — select-all toggle (multi only)
 * - `chips` — show chip tags for selected items (default: `true`)
 * - `loadOptions` — async paginated loading function
 * - `disabled` — config-level disabled flag (also the `disabled` component input)
 *
 * **Mobile vs Desktop:** The `isMobile()` platform utility switches the overlay
 * strategy at runtime. Use the Device toolbar in Storybook to simulate mobile.
 */
const meta: Meta<DsSelectComponent> = {
  title: '1. P0 Components/Select',
  component: DsSelectComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Searchable single/multi-select. Opens a CDK overlay on desktop and an IonModal sheet on mobile. Supports chips, search, select-all, and paginated async loading.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  argTypes: {
    disabled: { control: 'boolean', description: 'Prevent opening the dropdown' },
  },
  decorators: [
    withHessaProviders({ mobile: false }),
    moduleMetadata({ imports: [DsSelectComponent] }),
    componentWrapperDecorator(
      (story) => `<div class="max-w-sm p-ds-xl">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsSelectComponent>;

// ─── Shared option sets ──────────────────────────────────────────────────────

const subjectOptions = [
  { id: 'math', display: 'Mathematics' },
  { id: 'sci', display: 'Science' },
  { id: 'eng', display: 'English' },
  { id: 'arab', display: 'Arabic' },
  { id: 'islamic', display: 'Islamic Studies' },
  { id: 'pe', display: 'Physical Education' },
  { id: 'art', display: 'Art' },
  { id: 'music', display: 'Music' },
];

const singleConfig: DsSelectConfig = {
  label: 'Subject',
  placeholder: 'Select a subject',
  options: subjectOptions,
  isMultiple: false,
  showSearch: true,
};

const multiConfig: DsSelectConfig = {
  label: 'Subjects',
  placeholder: 'Select subjects',
  options: subjectOptions,
  isMultiple: true,
  showSearch: true,
  showSelectAll: true,
};

// ─── Single Select ───────────────────────────────────────────────────────────

export const SingleSelect: Story = {
  name: 'Single select',
  parameters: {
    docs: {
      description: {
        story:
          'Basic single-select dropdown. Search is enabled by default. Click to open the CDK overlay (or modal on mobile).',
      },
    },
  },
  args: { config: singleConfig },
};

// ─── Multi Select ────────────────────────────────────────────────────────────

export const MultiSelect: Story = {
  name: 'Multi-select',
  parameters: {
    docs: {
      description: {
        story:
          '`isMultiple=true` allows selecting multiple options. Selected items render as removable chips below the input. `showSelectAll=true` adds a Select All / Clear control.',
      },
    },
  },
  args: { config: multiConfig },
};

// ─── With Search ─────────────────────────────────────────────────────────────

export const WithSearch: Story = {
  name: 'With search (default)',
  parameters: {
    docs: {
      description: {
        story:
          '`showSearch=true` (the default) renders a search input inside the dropdown panel. Typing filters the options list in real-time.',
      },
    },
  },
  args: {
    config: {
      ...singleConfig,
      label: 'Search subject',
      placeholder: 'Type to search…',
      showSearch: true,
    },
  },
};

// ─── No Search ───────────────────────────────────────────────────────────────

export const NoSearch: Story = {
  name: 'Without search',
  parameters: {
    docs: {
      description: {
        story:
          '`showSearch=false` hides the search input and disables search-related logic. Best for short, static option lists (≤6 items).',
      },
    },
  },
  args: {
    config: {
      label: 'Grade',
      placeholder: 'Pick a grade',
      options: [
        { id: 'g1', display: 'Grade 1' },
        { id: 'g2', display: 'Grade 2' },
        { id: 'g3', display: 'Grade 3' },
        { id: 'g4', display: 'Grade 4' },
        { id: 'g5', display: 'Grade 5' },
      ],
      isMultiple: false,
      showSearch: false,
    },
  },
};

// ─── Paginated ───────────────────────────────────────────────────────────────

export const Paginated: Story = {
  name: 'Paginated (async loading)',
  parameters: {
    docs: {
      description: {
        story: `
When \`loadOptions\` is provided, the component fetches options from the server.
\`isPaginated=true\` enables infinite scroll inside the dropdown — scrolling to the
bottom triggers the next page load. The spinner appears during initial load and each
subsequent page fetch.

> **In this story** the \`loadOptions\` function is not wired to a real endpoint, so the
> component renders in its initial loading state (spinner visible). In production, pass
> an Observable-returning function that accepts \`{ searchText, params }\`.
        `,
      },
    },
  },
  args: {
    config: {
      label: 'Students',
      placeholder: 'Search students…',
      options: [],
      isMultiple: false,
      showSearch: true,
      isPaginated: true,
      // Keeps the async branch pending so the loading spinner is visible after opening.
      loadOptions: () => NEVER as any,
    } as DsSelectConfig,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByPlaceholderText('Search students…'));

    const body = within(document.body);
    await expect(await body.findByLabelText('Loading')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  name: 'State: Loading (async options)',
  parameters: {
    docs: {
      description: {
        story:
          'Async `loadOptions` branch with a pending Observable. Opening the select shows the production loading spinner.',
      },
    },
  },
  args: Paginated.args,
  play: Paginated.play,
};

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  name: 'State: Disabled',
  parameters: {
    docs: {
      description: {
        story:
          '`disabled=true` (component input) or `config.disabled=true` prevents the overlay from opening and applies muted styling. The search input is also hidden.',
      },
    },
  },
  args: {
    config: {
      ...singleConfig,
      label: 'Subject (locked)',
    },
    disabled: true,
  },
};

// ─── Mobile View ─────────────────────────────────────────────────────────────

export const MobileView: Story = {
  name: 'Mobile view (IonModal)',
  parameters: {
    docs: {
      description: {
        story: `
This story provides a mobile \`Platform\` mock, so the component uses its real
\`IonModal\` branch without relying on DevTools viewport emulation. Click the
select trigger to inspect the mobile sheet behavior.
        `,
      },
    },
  },
  render: () => ({
    template: `
      <div class="mx-auto max-w-sm">
        <p class="single-line-caption-mid-emphasis mb-ds-md px-ds-xl text-content-mid">
          Mobile Platform mock active. The select opens through the IonModal branch.
        </p>
        <div class="px-ds-xl">
          <app-ds-select [config]="config"></app-ds-select>
        </div>
      </div>
    `,
    props: {
      config: {
        label: 'Subject',
        placeholder: 'Select a subject',
        options: subjectOptions,
        isMultiple: false,
        showSearch: true,
      } as DsSelectConfig,
    },
  }),
  decorators: [
    withHessaProviders({ mobile: true }),
    componentWrapperDecorator(
      (story) =>
        `<div class="mx-auto w-full max-w-sm bg-surface-primary py-ds-xl">${story}</div>`,
    ),
  ],
};

// ─── Required ────────────────────────────────────────────────────────────────

export const Required: Story = {
  name: 'Required field',
  parameters: {
    docs: {
      description: {
        story: '`config.required=true` shows the required indicator on the label.',
      },
    },
  },
  args: { config: { ...singleConfig, required: true } },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  parameters: {
    docs: {
      description: {
        story:
          'Left-to-right layout with English options. Wrapper overrides `dir` for documentation purposes.',
      },
    },
  },
  args: { config: singleConfig },
  decorators: [
    withHessaProviders({ locale: 'en', mobile: false }),
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" class="max-w-sm p-ds-xl">${story}</div>`,
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
          'Right-to-left layout with Arabic option labels. The dropdown arrow and search icon mirror automatically. Lama Rounded font applied.',
      },
    },
  },
  args: {
    config: {
      label: 'المادة',
      placeholder: 'اختر مادة',
      isMultiple: false,
      showSearch: true,
      options: [
        { id: 'math', display: 'الرياضيات' },
        { id: 'sci', display: 'العلوم' },
        { id: 'arab', display: 'اللغة العربية' },
        { id: 'eng', display: 'اللغة الإنجليزية' },
        { id: 'islamic', display: 'التربية الإسلامية' },
        { id: 'pe', display: 'التربية البدنية' },
      ],
    },
  },
  decorators: [
    withHessaProviders({ locale: 'ar', mobile: false }),
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" class="max-w-sm p-ds-xl">${story}</div>`,
    ),
  ],
};
