import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DsResponsiveTableComponent,
  DsHeaderPrefixDirective,
  DsResponsiveTableConfig,
  DsResponsiveColumn,
  DsBulkAction,
  DsBulkActionEvent,
  DsSortChangeEvent,
  DsDataSourceRequest,
  DsDataSourceResponse,
} from '@ds/ds-responsive-table';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  faFileExport,
  faPlay,
  faStop,
  faEye,
  faPencil,
  faTrash,
  faPlus,
} from '@fortawesome/pro-solid-svg-icons';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { DsAgGridTitleSubtitleCellComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-cell.component';
import { DsAgGridTitleSubtitleHeaderComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-header.component';
import { Observable, of, delay } from 'rxjs';

interface StudentRow {
  id: number;
  name: string;
  nationalId: string;
  studentId: string;
  status: 'Active' | 'Inactive' | 'Pending';
  guardians: string;
  date: string;
  level: string;
  class: string;
  email: string;
  phone: string;
  // Additional fields for horizontal scroll testing
  field01: string;
  field02: string;
  field03: string;
  field04: string;
  field05: string;
  field06: string;
  field07: string;
  field08: string;
  field09: string;
  field10: string;
}

@Component({
  selector: 'app-responsive-table-demo',
  templateUrl: './responsive-table-demo.page.html',
  standalone: true,
  imports: [
    CommonModule,
    DsResponsiveTableComponent,
    DsHeaderPrefixDirective,
    DsButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveTableDemoPage {
  private readonly toaster = inject(HesToasterService);

  /** Master data set (simulating a database) */
  private readonly allRows: StudentRow[] = this.buildRows(100);

  /** Toggle for bulk actions (for demo purposes) */
  readonly bulkActionsEnabled = signal<boolean>(true);

  /** Toggle bulk actions on/off */
  toggleBulkActions(): void {
    this.bulkActionsEnabled.update((v) => !v);
  }

  /**
   * Columns configuration with mobile slot mapping
   * - title: Main display name
   * - subtitle: Secondary text below title
   * - badge: Status badges
   * - metadata: Key-value pairs in details section
   */
  readonly columns: DsResponsiveColumn<StudentRow>[] = [
    {
      field: 'name',
      headerName: 'Name',
      headerComponent: DsAgGridTitleSubtitleHeaderComponent,
      headerComponentParams: {
        title: 'Name',
        subtitle: 'Level - Class',
      },
      cellRenderer: DsAgGridTitleSubtitleCellComponent,
      cellRendererParams: {
        titleField: 'name',
        subtitleFields: ['level', 'class'],
        subtitleSeparator: ' - ',
      },
      pinned: 'start',
      lockPinned: true,
      sortable: true,
      mobile: { slot: 'title' },
    },
    {
      field: 'level',
      headerName: 'Level',
      hide: true, // Hidden on desktop - shown in title/subtitle cell
      excludeFromCustomization: true, // Already shown in Name column's subtitle
      mobile: { slot: 'subtitle' },
    },
    {
      field: 'status',
      headerName: 'Status',
      mobile: {
        slot: 'badge',
        order: 1,
        badgeVariant: (value) => {
          switch (value) {
            case 'Active':
              return 'success';
            case 'Inactive':
              return 'danger';
            case 'Pending':
              return 'warning';
            default:
              return 'neutral';
          }
        },
      },
    },
    {
      field: 'class',
      headerName: 'Class',
      hide: true, // Hidden on desktop - shown in title/subtitle cell
      excludeFromCustomization: true, // Already shown in Name column's subtitle
      mobile: {
        slot: 'badge',
        order: 2,
        badgeVariant: 'info',
      },
    },
    {
      field: 'nationalId',
      headerName: 'National ID',
      sortable: true,
      mobile: { slot: 'metadata', order: 1 },
    },
    {
      field: 'studentId',
      headerName: 'Student ID',
      sortable: true,
      mobile: { slot: 'metadata', order: 2 },
    },
    {
      field: 'email',
      headerName: 'Email',
      sortable: true,
      mobile: { slot: 'metadata', order: 3 },
    },
    {
      field: 'phone',
      headerName: 'Phone',
      sortable: true,
      mobile: { slot: 'metadata', order: 4 },
    },
    {
      field: 'guardians',
      headerName: 'Linked Guardians',
      mobile: { slot: 'metadata', order: 5 },
    },
    {
      field: 'date',
      headerName: 'Date of Birth',
      sortable: true,
      mobile: { slot: 'metadata', order: 6 },
    },
    // Additional fields for horizontal scroll testing
    { field: 'field01', headerName: 'Field 1' },
    { field: 'field02', headerName: 'Field 2' },
    { field: 'field03', headerName: 'Field 3' },
    { field: 'field04', headerName: 'Field 4' },
    { field: 'field05', headerName: 'Field 5' },
    { field: 'field06', headerName: 'Field 6' },
    { field: 'field07', headerName: 'Field 7' },
    { field: 'field08', headerName: 'Field 8' },
    { field: 'field09', headerName: 'Field 9' },
    { field: 'field10', headerName: 'Field 10' },
  ];

  /** Bulk actions definition (extracted for toggle demo) */
  private readonly bulkActions: DsBulkAction<StudentRow>[] = [
    {
      id: 'export',
      label: 'Export',
      activeLabel: 'Export selected',
      icon: faFileExport,
      action: (rows) =>
        this.toaster.success(`Exporting ${rows.length} students`),
    },
    {
      id: 'activate',
      label: 'Activate',
      activeLabel: 'Activate selected',
      icon: faPlay,
      visible: (rows) => rows.some((row) => row.status !== 'Active'),
      disabled: (rows) => rows.some((row) => row.status === 'Active'),
      disabledReason: (rows) => {
        const activeCount = rows.filter(
          (row) => row.status === 'Active',
        ).length;
        if (!activeCount) return undefined;
        return `${activeCount} active students included. Deselect active students to activate.`;
      },
      action: (rows) =>
        this.toaster.success(`Activating ${rows.length} students`),
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      activeLabel: 'Deactivate selected',
      icon: faStop,
      visible: (rows) => rows.some((row) => row.status === 'Active'),
      disabled: (rows) => rows.some((row) => row.status !== 'Active'),
      disabledReason: (rows) => {
        const inactiveCount = rows.filter(
          (row) => row.status !== 'Active',
        ).length;
        if (!inactiveCount) return undefined;
        return `${inactiveCount} inactive students included. Deselect inactive students to deactivate.`;
      },
      action: (rows) =>
        this.toaster.success(`Deactivating ${rows.length} students`),
    },
  ];

  /**
   * Main config that drives both table and mobile list
   * Single configuration object containing columns, filters, actions, and all settings
   *
   * When dataSource is provided, the component handles ALL state internally:
   * - Loading state
   * - Filter values
   * - Pagination
   * - Infinite scroll
   * - Data fetching on filter/sort/pagination changes
   *
   * Consumer only needs to pass [config] - no need for [rowData], [loading], etc.
   */
  readonly config = computed<DsResponsiveTableConfig<StudentRow>>(() => ({
    columns: this.columns,

    // DataSource function - component handles all state internally
    dataSource: (request) => this.fetchStudents(request),

    // Filters shown in DsFilterPanel
    filters: [
      {
        type: 'search',
        key: 'search',
        label: 'Search',
        placeholder: 'Search by name, number or ID',
        exposed: true,
      },
      {
        type: 'select',
        key: 'status',
        label: 'Status',
        config: {
          placeholder: 'Status',
          options: [
            { id: 'active', display: 'Active' },
            { id: 'inactive', display: 'Inactive' },
            { id: 'pending', display: 'Pending' },
          ],
        },
      },
      {
        type: 'select',
        key: 'level',
        label: 'Level',
        config: {
          placeholder: 'Level',
          options: [
            { id: 'elementary_1', display: 'First Elementary' },
            { id: 'elementary_2', display: 'Second Elementary' },
            { id: 'elementary_3', display: 'Third Elementary' },
          ],
        },
      },
      {
        type: 'select',
        key: 'class',
        label: 'Class',
        config: {
          placeholder: 'Class',
          options: [
            { id: 'class_a', display: 'Class A' },
            { id: 'class_b', display: 'Class B' },
            { id: 'class_c', display: 'Class C' },
          ],
        },
      },
    ],

    rowActions: [
      {
        id: 'view',
        label: 'View',
        icon: faEye,
        action: (row) => this.toaster.success(`Viewing ${row.name}`),
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: faPencil,
        action: (row) => this.toaster.success(`Editing ${row.name}`),
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: faTrash,
        action: (row) => this.toaster.error(`Deleting ${row.name}`),
      },
    ],

    // Conditionally include bulk actions based on toggle
    bulkActions: this.bulkActionsEnabled() ? this.bulkActions : [],

    emptyState: {
      title: 'No students found',
      description:
        "Try adjusting your filters or search criteria to find what you're looking for.",
      imagePath: 'assets/illustrations/no-search-result.svg',
      filteredByLabel: 'Filtered by',
    },

    mobile: {
      showMetadataBackground: true,
      showSortButton: true,
      primaryAction: {
        label: 'Add Student',
        icon: faPlus,
        action: () => this.toaster.success('Add student clicked!'),
      },
    },

    table: {
      autoSizeStrategy: { type: 'fitCellContents' },
    },

    selection: {
      mode: 'multiple',
      entityLabel: 'Students',
      selectionLabel: 'Select students to',
    },
  }));

  // ============================================================================
  // Event Handlers - Only business logic, component handles state internally
  // ============================================================================

  onBulkAction(event: DsBulkActionEvent<StudentRow>): void {
    console.log('Bulk action', event.action.id, event.rows.length);
  }

  onSelectionChanged(rows: StudentRow[]): void {
    console.log('Selection changed:', rows.length, 'rows selected');
  }

  onRowClicked(row: StudentRow): void {
    console.log('Row clicked:', row.name);
  }

  onSortChanged(event: DsSortChangeEvent): void {
    console.log('Sort changed:', event.sort);
    if (event.sort) {
      this.toaster.success(
        `Sorted by ${event.sort.field} (${event.sort.direction})`,
      );
    } else {
      this.toaster.info('Sort cleared');
    }
  }

  // ============================================================================
  // DataSource - Simulates API call with filtering, sorting, and pagination
  // ============================================================================

  /**
   * DataSource function that simulates an API call
   * In real usage, this would call an HTTP service
   *
   * @param request - Contains page, perPage, sort, and filters (key-value pairs)
   * @returns Observable of response with data and pagination
   */
  private fetchStudents(
    request: DsDataSourceRequest,
  ): Observable<DsDataSourceResponse<StudentRow>> {
    console.log('DataSource request:', request);

    // Start with all data
    let result = [...this.allRows];

    // Filters are passed as-is with same keys as defined in config
    const { filters } = request;

    // Apply search filter (key matches the filter config key)
    const searchTerm = (filters['search'] as string)?.toLowerCase().trim();
    if (searchTerm) {
      result = result.filter(
        (row) =>
          row.name.toLowerCase().includes(searchTerm) ||
          row.nationalId.toLowerCase().includes(searchTerm) ||
          row.studentId.toLowerCase().includes(searchTerm) ||
          row.email.toLowerCase().includes(searchTerm),
      );
    }

    // Apply status filter
    const statusFilter = filters['status'] as string;
    if (statusFilter) {
      const statusMap: Record<string, string> = {
        active: 'Active',
        inactive: 'Inactive',
        pending: 'Pending',
      };
      result = result.filter((row) => row.status === statusMap[statusFilter]);
    }

    // Apply level filter
    const levelFilter = filters['level'] as string;
    if (levelFilter) {
      const levelMap: Record<string, string> = {
        elementary_1: 'First elementary grade',
        elementary_2: 'Second elementary grade',
        elementary_3: 'Third elementary grade',
      };
      result = result.filter((row) => row.level === levelMap[levelFilter]);
    }

    // Apply class filter
    const classFilter = filters['class'] as string;
    if (classFilter) {
      const classMap: Record<string, string> = {
        class_a: 'Class A',
        class_b: 'Class B',
        class_c: 'Class C',
      };
      result = result.filter((row) => row.class === classMap[classFilter]);
    }

    // Apply sorting
    if (request.sort) {
      result.sort((a, b) => {
        const aVal = String(a[request.sort!.field as keyof StudentRow] ?? '');
        const bVal = String(b[request.sort!.field as keyof StudentRow] ?? '');
        const comparison = aVal.localeCompare(bVal);
        return request.sort!.direction === 'asc' ? comparison : -comparison;
      });
    }

    // Calculate pagination
    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / request.perPage);
    const startIndex = (request.page - 1) * request.perPage;
    const pageData = result.slice(startIndex, startIndex + request.perPage);

    // Simulate API delay (500ms)
    return of({
      data: pageData,
      pagination: {
        totalItems,
        totalPages,
        pageNumber: request.page,
        itemsPerPage: request.perPage,
      },
    }).pipe(delay(500));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private buildRows(count: number, startIndex = 0): StudentRow[] {
    const levels = [
      'First elementary grade',
      'Second elementary grade',
      'Third elementary grade',
    ];
    const classes = ['Class A', 'Class B', 'Class C'];
    const statuses: ('Active' | 'Inactive' | 'Pending')[] = [
      'Active',
      'Inactive',
      'Pending',
    ];

    return Array.from({ length: count }).map((_, i) => {
      const index = startIndex + i;
      return {
        id: index + 1,
        name: `Student ${index + 1}`,
        nationalId: `2133011${String(index + 1).padStart(3, '0')}`,
        studentId: `STU-${100 + index}`,
        status: statuses[index % statuses.length],
        guardians: 'Muhammed Abdulaziz, Rahaf Abdulrahman',
        date: '17/01/2020',
        level: levels[index % levels.length],
        class: classes[index % classes.length],
        email: `student${index + 1}@school.edu`,
        phone: `+966 5${String(index).padStart(8, '0')}`,
        // Additional fields for horizontal scroll testing
        field01: `Value ${index + 1}-1`,
        field02: `Value ${index + 1}-2`,
        field03: `Value ${index + 1}-3`,
        field04: `Value ${index + 1}-4`,
        field05: `Value ${index + 1}-5`,
        field06: `Value ${index + 1}-6`,
        field07: `Value ${index + 1}-7`,
        field08: `Value ${index + 1}-8`,
        field09: `Value ${index + 1}-9`,
        field10: `Value ${index + 1}-10`,
      };
    });
  }
}
