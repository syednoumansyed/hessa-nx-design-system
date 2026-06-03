import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { AgGridModule } from 'ag-grid-angular';
import { DsAgGridTableComponent } from '@ds/ag-grid-table/ds-ag-grid-table.component';
import { DsAgGridTableConfig } from '@ds/ag-grid-table/ds-ag-grid-table.model';
import { DsResponsiveTableStateService } from '@ds/ds-responsive-table/ds-responsive-table-state.service';
import { DsModalService } from '@ds/modal';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

// Mock state persistence service to avoid Router dependency errors
class MockDsResponsiveTableStateService {
  generateStorageKey() {
    return 'mock-grid-storage-key';
  }
  loadState() {
    return {
      version: 1,
      timestamp: Date.now(),
      columnCustomization: null,
      filters: null,
      sort: null,
      zoom: null,
    };
  }
  saveState() {}
  mergeColumnState(saved: any, current: any[]) {
    return current.map((c) => ({
      id: c.colId || c.field || '',
      name: c.headerName || c.field || '',
      visible: !c.hide,
      canHide: !c.lockVisible,
      canReorder: !c.lockPinned,
    }));
  }
  clearState() {}
}

const mockDsModalService = {
  open: async () => ({
    onDismiss: async () => ({ role: 'close' }),
  }),
};

/**
 * # AG Grid Table — `app-ds-ag-grid-table`
 *
 * Highly functional data grid wrapper integrating ag-grid-community.
 * Renders column headers, actions, zoom buttons, pagination, and multi-select chevrons.
 */
const meta: Meta<DsAgGridTableComponent> = {
  title: '1. P0 Components/AG Grid Table',
  component: DsAgGridTableComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({ ionic: true, translocoTesting: true }),
    moduleMetadata({
      imports: [DsAgGridTableComponent, AgGridModule],
      providers: [
        {
          provide: DsResponsiveTableStateService,
          useClass: MockDsResponsiveTableStateService,
        },
        { provide: DsModalService, useValue: mockDsModalService },
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="p-ds-lg bg-surface-primary rounded-ds-xl border border-neutral-cool-300 min-h-[480px]">${story}</div>`,
    ),
  ],
  argTypes: {
    title: { control: 'text' },
    loading: { control: 'boolean' },
    showPagination: { control: 'boolean' },
    isGridInitialized: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DsAgGridTableComponent>;

const mockGridConfig: DsAgGridTableConfig<any> = {
  columns: [
    { field: 'name', headerName: 'Student', sortable: true, minWidth: 150 },
    { field: 'grade', headerName: 'Grade', sortable: true, minWidth: 100 },
    { field: 'status', headerName: 'Status', minWidth: 100 },
  ],
  bulkActions: [
    {
      id: 'delete',
      label: 'Delete Selected',
      action: (rows) => console.log('Delete bulk', rows),
    },
  ],
  rowActions: [
    {
      id: 'edit',
      title: 'Edit details',
      action: (row) => console.log('Row edit', row),
    },
  ],
};

const mockRows = [
  { id: '1', name: 'Ahmed Al-Rashid', grade: 'Grade 5', status: 'Active' },
  { id: '2', name: 'Sara Al-Mansouri', grade: 'Grade 6', status: 'Paused' },
  { id: '3', name: 'Omar Abdullah', grade: 'Grade 7', status: 'Active' },
];

// ─── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {
  name: 'Default (Populated Grid)',
  args: {
    title: 'Student Roster',
    config: mockGridConfig,
    rowData: mockRows,
    loading: false,
    isGridInitialized: true,
    showPagination: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify grid headers render
    const headerName = canvas.getByText('Student');
    await expect(headerName).toBeInTheDocument();

    // Verify row data renders
    const studentCell = canvas.getByText('Ahmed Al-Rashid');
    await expect(studentCell).toBeInTheDocument();
  },
};

// ─── Loading ─────────────────────────────────────────────────────────────────
export const Loading: Story = {
  name: 'State: Loading Overlay',
  args: {
    title: 'Loading Student Roster',
    config: mockGridConfig,
    rowData: mockRows,
    loading: true,
    isGridInitialized: true,
    showPagination: true,
  },
};

// ─── Disabled ────────────────────────────────────────────────────────────────
export const Disabled: Story = {
  name: 'State: Disabled Pagination & Actions',
  args: {
    title: 'Disabled Student Roster',
    config: mockGridConfig,
    rowData: mockRows,
    loading: false,
    isGridInitialized: true,
    showPagination: false,
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────
export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    title: 'English Student List',
    config: mockGridConfig,
    rowData: mockRows,
    isGridInitialized: true,
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────
export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    title: 'قائمة الطلاب',
    config: {
      columns: [
        { field: 'name', headerName: 'الطالب', sortable: true, minWidth: 150 },
        { field: 'grade', headerName: 'الصف', sortable: true, minWidth: 100 },
        { field: 'status', headerName: 'الحالة', minWidth: 100 },
      ],
      bulkActions: [
        {
          id: 'delete',
          label: 'حذف المحدد',
          action: (rows) => console.log('Delete bulk', rows),
        },
      ],
    },
    rowData: [
      { id: '1', name: 'أحمد الراشد', grade: 'الصف الخامس', status: 'نشط' },
      { id: '2', name: 'سارة المنصوري', grade: 'الصف السادس', status: 'معطل' },
    ],
    isGridInitialized: true,
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
