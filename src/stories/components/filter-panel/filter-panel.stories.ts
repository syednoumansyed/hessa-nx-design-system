import { Component, Input } from '@angular/core';
import { TuiRootModule } from '@taiga-ui/core';
import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsFilterPanelComponent } from '@ds/filter-panel/ds-filter-panel.component';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';

@Component({
  selector: 'story-filter-panel-harness',
  standalone: true,
  imports: [TuiRootModule, DsFilterPanelComponent],
  template: `
    <tui-root>
      <div class="flex flex-col gap-ds-md">
        <app-ds-filter-panel
          [filters]="filters"
          [selection]="selection"
          (filtersChange)="onFiltersChange($event)"
        />
        <p class="content-sm-default text-content-mid">
          Last filters: {{ lastChange }}
        </p>
      </div>
    </tui-root>
  `,
})
class StoryFilterPanelHarnessComponent {
  @Input() filters: DsFilterConfig[] = [];
  @Input() selection: DsFiltersValue = {};

  lastChange = 'none';

  onFiltersChange(value: DsFiltersValue): void {
    this.lastChange = JSON.stringify(value);
  }
}

const filters: DsFilterConfig[] = [
  {
    type: 'chip-selector',
    key: 'status',
    label: 'Status',
    exposed: true,
    multiple: false,
    options: [
      { value: 'active', displayedValue: 'Active' },
      { value: 'paused', displayedValue: 'Paused' },
    ],
  },
  {
    type: 'chip-selector',
    key: 'journalType',
    label: 'Journal type',
    multiple: true,
    options: [
      { value: 'weekly', displayedValue: 'Weekly' },
      { value: 'daily', displayedValue: 'Daily' },
    ],
  },
];

const requiredFilters: DsFilterConfig[] = filters.map((filter) =>
  filter.key === 'journalType' ? { ...filter, required: true } : filter,
);

/**
 * # Filter Panel
 *
 * Composes exposed filters with a Taiga-backed modal for additional filters.
 * Stories validate emitted values from both paths.
 */
const meta: Meta<DsFilterPanelComponent> = {
  title: '2. P1 Components/Filter Panel',
  component: DsFilterPanelComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Filter bar with exposed filters and modal-only filters. Uses TuiDialogService for the modal branch and emits normalized filter values.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  argTypes: {
    filters: { control: 'object' },
    selection: { control: 'object' },
  },
  decorators: [
    withHessaProviders({ taiga: true, translocoTesting: true }),
    moduleMetadata({
      imports: [DsFilterPanelComponent, StoryFilterPanelHarnessComponent],
    }),
    componentWrapperDecorator(
      (story) => `<div class="w-[560px] max-w-full p-ds-xl">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsFilterPanelComponent>;

const renderHarness = (selection: DsFiltersValue = {}) => ({
  props: { filters, selection },
  template: `
    <story-filter-panel-harness
      [filters]="filters"
      [selection]="selection"
    />
  `,
});

export const Default: Story = {
  render: () => renderHarness(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText('Active'));
    await expect(
      await canvas.findByText('Last filters: {"status":"active"}'),
    ).toBeInTheDocument();
  },
};

export const ModalApply: Story = {
  name: 'Modal apply path',
  render: () => renderHarness(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTitle('Filters'));

    const body = within(document.body);
    await expect(await body.findByText('Journal type')).toBeInTheDocument();
    await userEvent.click(await body.findByText('Weekly'));
    await userEvent.click(await body.findByRole('button', { name: 'Apply' }));

    await expect(
      await canvas.findByText('Last filters: {"journalType":["weekly"]}'),
    ).toBeInTheDocument();
  },
};

export const WithSelection: Story = {
  render: () => renderHarness({ status: 'paused', journalType: ['daily'] }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Paused')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  name: 'Disabled apply until required filter is set',
  render: () => ({
    props: { filters: requiredFilters, selection: {} },
    template: `
      <story-filter-panel-harness
        [filters]="filters"
        [selection]="selection"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTitle('Filters'));

    const body = within(document.body);
    const applyButton = await body.findByRole('button', { name: 'Apply' });
    await expect(applyButton).toBeDisabled();
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => renderHarness(),
  decorators: [
    withHessaProviders({
      taiga: true,
      locale: 'en',
      translocoTesting: true,
    }),
  ],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => renderHarness(),
  decorators: [
    withHessaProviders({
      taiga: true,
      locale: 'ar',
      translocoTesting: true,
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="w-[560px] max-w-full p-ds-xl" lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
