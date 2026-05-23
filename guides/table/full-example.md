# Full Example (Server side)

This example demonstartes the use of `hesTableComponent` with server side everything! (listing, sorting, filtering and pagination) and row actions!

First, create a new service for your new listing page/component.
this service will contain your source signals for listing data and pagination as well as methods to
fetch your data over API with support for filtering, sorting and pagination.

Then, add two signal sources for data and pagination

```typescript
@Injectable({
  providedIn: "root",
})
export class GuardianService {
  private guardiansSignal = signal<IGuardianListItem[]>([]);
  readonly guardiansList = this.guardiansSignal.asReadonly();

  private guardiansPaginationSignal = signal<IPagination | null>(null);
  readonly guardiansPagination = this.guardiansPaginationSignal.asReadonly();
}
```

> Note: Data fetched over API won't always match the data model you want to list, that means you might need to create separate types (that might intersect) for data returned over API and the model of the list you want to display and map the first into the latter

> `IGuardianListItem` represents the data model we are going to list

Secondly, create a method to retrieve data Using `HttpClient`

```typescript
@Injectable({
  providedIn: "root",
})
export class GuardianService {
  private guardiansSignal = signal<IGuardianListItem[]>([]);
  readonly guardiansList = this.guardiansSignal.asReadonly();

  private guardiansPaginationSignal = signal<IPagination | null>(null);
  readonly guardiansPagination = this.guardiansPaginationSignal.asReadonly();

  getGuardiansList(params?: IGuardianQueryParams) {
    return this.http.get<IPaginatedResponse<IGuardian[]>>(`${ApiUrl.v1BE}/guardians`, {
      params: {
        ...params,
      },
    });
  }
}
```

> `IGuardianQueryParams` represents the API query params we can use to filter, sort and paginate the list of items being fetched

Then, map the fetched data to the data model you will list in hes-table and update the source signal with the mapped data and the pagination signal with the returned pagination object

```typescript
@Injectable({
  providedIn: "root",
})
export class GuardianService {
  private guardiansSignal = signal<IGuardianListItem[]>([]);
  readonly guardiansList = this.guardiansSignal.asReadonly();

  private guardiansPaginationSignal = signal<IPagination | null>(null);
  readonly guardiansPagination = this.guardiansPaginationSignal.asReadonly();

  getGuardiansList(params?: IGuardianQueryParams) {
    return this.http
      .get<IPaginatedResponse<IGuardian[]>>(`${ApiUrl.v1BE}/guardians`, {
        params: {
          ...params,
        },
      })
      .subscribe({
        next: (res) => {
          this.populateGuardians(this.mapGuardiansToGuardianListItems(res.data));
          this.guardiansPaginationSignal.set(res.paginate);
        },
        error: (err) => {
          if (err.status === 404 && err.error.paginate.totalItems === 0) {
            this.populateGuardians([]);
          }
          this.guardiansPaginationSignal.set(err.error.paginate);
        },
      });
  }

  populateGuardians(v: IGuardianListItem[]) {
    this.guardiansSignal.set(v);
  }

  mapGuardiansToGuardianListItems(guardians: IGuardian[]): IGuardianListItem[] {
    return guardians.map((guardian) => {
      return {
        id: guardian.id,
        fullName: guardian.fullName,
        phoneNumber: guardian.countryCode + guardian.phoneNumber,
        gender: guardian.gender,
        nationalId: guardian.nationalId,
        student: guardian.students[0].fullName,
        actions: "",
        status: guardian.status,
      };
    });
  }
}
```

Then in your component Class inject your service and get a reference to the `guardiansList` and `guardiansPagination` source signal and call `getGuardiansList` method in OnInit lifecycle call to call the API and populate the source signal

```typescript
@Component({
  selector: "app-guardians",
  templateUrl: "./guardians.page.html",
  standalone: true,
  imports: [HesTableComponent],
})
export class GuardiansPage implements OnInit {
  guardiansList = this.guardianService.guardiansList;
  guardiansPagination = this.guardianService.guardiansPagination;

  constructor(private guardianService: GuardianService) {}

  ngOnInit() {
    this.guardianService.getGuardiansList();
  }
}
```

Now add your column Definitions based on your data model and define which columns supports sorting and filtering

```typescript
@Component({
  selector: "app-guardians",
  templateUrl: "./guardians.page.html",
  standalone: true,
  imports: [HesTableComponent],
})
export class GuardiansPage implements OnInit {
    ...
    columns: ITableCol<IGuardianListItem>[] = [
    {
      field: 'fullName',
      headerName: 'Full Name',
      sortable: true,
      filter: true,
    },
    {
      field: 'phoneNumber',
      headerName: 'phoneNumber',
      sortable: false,
      filter: true,
    },
    {
      field: 'gender',
      headerName: 'Gender',
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: 'Gender',
      filterSelectOptions: dropdownArrayFromEnum(Gender),
    },
  ];

  constructor(private guardianService: GuardianService) {}

  ngOnInit() {
    this.guardianService.getGuardiansList();
  }
}
```

> Note in the third column we defined it's filter type as `'Select'` and passed an array of `IDropdown` Objects, that will make hes-table render a dropdown filter of predefined values in place of the default text filter

Now let's create method that will listen to `filterSortModelChanged` event emitter and map the event passed to the `IGuardianQueryParams` and pass it to `getGuardiansList` method in our service.

```typescript
@Component({
  selector: "app-guardians",
  templateUrl: "./guardians.page.html",
  standalone: true,
  imports: [HesTableComponent],
})
export class GuardiansPage implements OnInit {
    ...

  ngOnInit() {
    this.guardianService.getGuardiansList();
  }

  onTableModelChanged(event: ITableModel<IGuardianQueryParams>) {
    if (!event) {
      this.guardianService.getGuardiansList();
    } else {
      const { colName, order, pageNumber, itemsPerPage, ...params } = event;
      this.guardianService.getGuardiansList({
        ...params,
        ...(colName && { sortByColumn: colName }),
        ...(order && { order }),
        ...(pageNumber && { pageNumber: pageNumber.toString() }),
        ...(itemsPerPage && { itemsPerPage: itemsPerPage.toString() }),
      });
    }
  }
}
```

> `ITableModel` event is a union of filter, sort and pagination events.

> `ITableModel` event will only contain activ values.

> in case the user filters a certain col by value, it will contain only the key and value pair for this filter and and keys for active pagination and sorting values (if any), that's why in the code above we are checking if the key exist before adding it to our query object to avoid api errors

Now, Use the `app-hes-table` component in your template.

```html
<app-hes-table [columns]="columns" [rowData]="guardiansList()" (filterSortModelChanged)="onTableModelChanged($event)" [pagination]="guardiansPagination()"></app-hes-table>
```

Finally, let's add actions column.

Create an array of `IAction` Objects and pass it to new object inside `columns` object

```typescript
@Component({
  selector: "app-guardians",
  templateUrl: "./guardians.page.html",
  standalone: true,
  imports: [HesTableComponent],
})
export class GuardiansPage implements OnInit {
  ...

  actions: IAction<IGuardianListItem>[] = [
    {
      iconProps: { icon: faEye },
      text: "View",
      onClick: (data) => {
        this.router.navigate([data?.id], {
          relativeTo: this.route,
        });
      },
    },
    {
      iconProps: { icon: faPen },
      text: "Edit",
      onClick: (data) => {
        this.router.navigate([data?.id, "update"], {
          relativeTo: this.route,
        });
      },
    },
    {
      iconProps: { icon: faBan, flip: "horizontal" },
      text: "Deactivate",
      textFormatter: (data) => (data.status === ResourceStatus.ACTIVE ? "Deactivate" : "Activate"),
      onClick: (data) => {
        data.status === ResourceStatus.ACTIVE ? this.deactivateGuardian(data.id) : this.activateGuardian(data.id);
      },
    },
  ];
  columns: ITableCol<IGuardianListItem>[] = [
    ...
    ,
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filter: false,
      type: "action",
      actions: this.actions,
    },
  ];

   constructor(
    private guardianService: GuardianService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  deactivateGuardian(id: number) {
    this.guardianService.deactivateGuardian(id.toString()).subscribe({
      next: () => {
        this.guardianService.getGuardiansList();
      },
    });
  }

  activateGuardian(id: number) {
    this.guardianService.activateGuardian(id.toString()).subscribe({
      next: () => {
        this.guardianService.getGuardiansList();
      },
    });
  }
}
```
