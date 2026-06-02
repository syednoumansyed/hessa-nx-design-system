import { Component, Input } from '@angular/core';
import { TuiRootModule } from '@taiga-ui/core';
import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { of, throwError } from 'rxjs';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsResponsiveTableComponent } from '@ds/ds-responsive-table/ds-responsive-table.component';
import {
  DsResponsiveColumn,
  DsResponsiveTableConfig,
} from '@ds/ds-responsive-table/ds-responsive-table.model';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';
import { IPagination } from '@shared/interfaces/api.interface';

interface StudentRow {
  id: string;
  name: string;
  grade: string;
  status: string;
  attendance: string;
}

@Component({
  selector: 'story-responsive-table-harness',
  standalone: true,
  imports: [TuiRootModule, DsResponsiveTableComponent],
  template: `
    <tui-root>
      <div class="flex h-full min-h-0 flex-col gap-ds-md">
        <ds-responsive-table
          class="min-h-0 flex-1"
          [config]="config"
          [rowData]="rowData"
          [pagination]="pagination"
          [filters]="filters"
          [filtersSelection]="filtersSelection"
          [loading]="loading"
          (filtersChange)="onFiltersChange($event)"
          (rowClicked)="lastRow = $event.name"
        />
        <p class="content-sm-default text-content-mid">
          Last filters: {{ lastFilters }}
        </p>
        <p class="content-sm-default text-content-mid">
          Last row: {{ lastRow || 'none' }}
        </p>
      </div>
    </tui-root>
  `,
})
class StoryResponsiveTableHarnessComponent {
  @Input({ required: true }) config!: DsResponsiveTableConfig<StudentRow>;
  @Input() rowData: StudentRow[] = [];
  @Input() pagination: IPagination | null = null;
  @Input() filters: DsFilterConfig[] = [];
  @Input() filtersSelection: DsFiltersValue = {};
  @Input() loading = false;

  lastFilters = 'none';
  lastRow = '';

  onFiltersChange(value: DsFiltersValue): void {
    this.lastFilters = JSON.stringify(value);
  }
}

const rows: StudentRow[] = [
  {
    id: '1',
    name: 'Ahmed Al-Rashid',
    grade: 'Grade 5',
    status: 'Active',
    attendance: '92%',
  },
  {
    id: '2',
    name: 'Sara Al-Mansouri',
    grade: 'Grade 6',
    status: 'Paused',
    attendance: '81%',
  },
  {
    id: '3',
    name: 'Omar Abdullah',
    grade: 'Grade 7',
    status: 'Active',
    attendance: '97%',
  },
];

const columns: DsResponsiveColumn<StudentRow>[] = [
  {
    field: 'name',
    headerName: 'Student',
    mobile: { slot: 'title' },
  },
  {
    field: 'grade',
    headerName: 'Grade',
    mobile: { slot: 'subtitle' },
  },
  {
    field: 'status',
    headerName: 'Status',
    mobile: {
      slot: 'badge',
      badgeVariant: (value) => (value === 'Active' ? 'success' : 'warning'),
    },
  },
  {
    field: 'attendance',
    headerName: 'Attendance',
    mobile: { slot: 'metadata' },
  },
];

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
];

const pagination: IPagination = {
  pageNumber: 1,
  itemsPerPage: 10,
  totalItems: rows.length,
  totalPages: 1,
};

const baseConfig: DsResponsiveTableConfig<StudentRow> = {
  columns,
  filters,
  table: {
    rowClickable: true,
    showPagination: false,
    showZoom: false,
  },
  mobile: {
    showSortButton: true,
    showMetadataBackground: true,
  },
  selection: {
    mode: 'none',
    entityLabel: 'students',
  },
  emptyState: {
    title: 'No students found',
    description: 'Try adjusting your filters.',
  },
  persistState: false,
};

const selectableConfig: DsResponsiveTableConfig<StudentRow> = {
  ...baseConfig,
  selection: {
    mode: 'multiple',
    entityLabel: 'students',
    isRowSelectable: () => false,
  },
};

const dataSourceConfig: DsResponsiveTableConfig<StudentRow> = {
  ...baseConfig,
  dataSource: (request) =>
    of({
      data: rows.filter((row) =>
        request.filters['status'] === 'active'
          ? row.status === 'Active'
          : true,
      ),
      pagination,
    }),
  initialFilters: {},
};

const errorConfig: DsResponsiveTableConfig<StudentRow> = {
  ...baseConfig,
  dataSource: () => throwError(() => ({ status: 500 })),
  initialFilters: {},
};

/**
 * # Responsive Table
 *
 * Single table contract that renders AG Grid on desktop and mobile cards on
 * compact layouts.
 */
const meta: Meta<DsResponsiveTableComponent<StudentRow>> = {
  title: '2. P1 Components/Responsive Table',
  component: DsResponsiveTableComponent<StudentRow>,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Responsive data table/list. Desktop uses the design-system AG Grid table; mobile uses card lists, floating actions, mobile sort, and filter panel integration.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  argTypes: {
    config: { control: 'object' },
    rowData: { control: 'object' },
    pagination: { control: 'object' },
    filters: { control: 'object' },
    filtersSelection: { control: 'object' },
    loading: { control: 'boolean' },
  },
  decorators: [
    withHessaProviders({
      layout: true,
      mobile: false,
      taiga: true,
      toaster: 'mock',
      translocoTesting: true,
    }),
    moduleMetadata({
      imports: [
        DsResponsiveTableComponent,
        StoryResponsiveTableHarnessComponent,
      ],
    }),
    componentWrapperDecorator(
      (story) => `<div class="h-[560px] w-full p-ds-xl">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsResponsiveTableComponent<StudentRow>>;

const renderHarness = (
  config: DsResponsiveTableConfig<StudentRow> = baseConfig,
  rowData: StudentRow[] = rows,
  loading = false,
) => ({
  props: {
    config,
    rowData,
    pagination,
    filters,
    filtersSelection: {},
    loading,
  },
  template: `
    <story-responsive-table-harness
      [config]="config"
      [rowData]="rowData"
      [pagination]="pagination"
      [filters]="filters"
      [filtersSelection]="filtersSelection"
      [loading]="loading"
    />
  `,
});

export const Default: Story = {
  render: () => renderHarness(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Ahmed Al-Rashid')).toBeInTheDocument();
    await userEvent.click(await canvas.findByText('Active'));
    await expect(
      await canvas.findByText('Last filters: {"status":"active"}'),
    ).toBeInTheDocument();
  },
};

export const DataSourceContract: Story = {
  name: 'Data source contract',
  render: () => renderHarness(dataSourceConfig, []),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Ahmed Al-Rashid')).toBeInTheDocument();
  },
};

export const Mobile: Story = {
  render: () => renderHarness(),
  decorators: [
    withHessaProviders({
      layout: true,
      mobile: true,
      taiga: true,
      toaster: 'mock',
      translocoTesting: true,
    }),
    componentWrapperDecorator(
      (story) => `<div class="h-[667px] w-[390px] p-ds-md">${story}</div>`,
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Ahmed Al-Rashid')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  name: 'Disabled row selection',
  render: () => renderHarness(selectableConfig),
};

export const Loading: Story = {
  name: 'State: Loading',
  render: () => renderHarness(baseConfig, [], true),
};

export const Error: Story = {
  name: 'Data source error fallback',
  render: () => renderHarness(errorConfig, []),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('No students found')).toBeInTheDocument();
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => renderHarness(),
  decorators: [
    withHessaProviders({
      layout: true,
      mobile: false,
      taiga: true,
      toaster: 'mock',
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
      layout: true,
      mobile: false,
      taiga: true,
      toaster: 'mock',
      locale: 'ar',
      translocoTesting: true,
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="h-[560px] w-full p-ds-xl" lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
