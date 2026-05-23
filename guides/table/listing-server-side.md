# Listing (Server side)

First, create a signal inside a service as a source of your listing data with methods to populate it in your service

> Note: Data fetched over API won't always match the data model you want to list, that means you might need to create separate types (that might intersect) for data returned over API and the model of the list you want to display and map the first into the latter

```typescript
@Injectable({
  providedIn: "root",
})
export class StudentsService {
  private studentsSignal = signal<IStudentListItem[]>([]);
  readonly studentsList = this.studentsSignal.asReadonly();
}
```

here `IStudentListItem` represents the data model we are going to list

Secondly, create a method to retrieve data Using `HttpClient`

```typescript
@Injectable({
  providedIn: "root",
})
export class StudentsService {
  private studentsSignal = signal<IStudentListItem[]>([]);
  readonly studentsList = this.studentsSignal.asReadonly();

  constructor(private http: HttpClient) {}

  getStudentsList() {
    return this.http.get<IPaginatedResponse<IStudent[]>>(`${ApiUrl.v1BE}/students`).subscribe();
  }
}
```

Then, map the fetched data to the data model you will list in hes-table and update the source signal with the mapped data

```typescript
@Injectable({
  providedIn: "root",
})
export class StudentsService {
  private studentsSignal = signal<IStudentListItem[]>([]);
  readonly studentsList = this.studentsSignal.asReadonly();

  constructor(private http: HttpClient) {}

  getStudentsList() {
    return this.http.get<IPaginatedResponse<IStudent[]>>(`${ApiUrl.v1BE}/students`).subscribe({
      next: (res) => {
        this.populateStudents(this.mapStudentsToStudentListItems(res.data));
      },
      error: (err) => {
        if (err.status === 404 && err.error.paginate.totalItems === 0) {
          this.populateStudents([]);
        }
      },
    });
  }
  populateStudents(v: IStudentListItem[]) {
    this.studentsSignal.set(v);
  }

  mapStudentsToStudentListItems(students: IStudent[]): IStudentListItem[] {
    return students.map((student) => {
      return {
        id: student.id,
        nationalId: student.nationalId,
        phoneNumber: student.countryCode + student.phoneNumber,
        fullName: student.fullName,
        ...
      };
    });
  }
}
```

Then in your component Class inject your service and get a reference to the `studentsList` source signal and call `getStudentsList` method in OnInit lifecycle call to call the API and populate the source signal

```typescript
@Component({
  selector: "app-students",
  templateUrl: "./students.page.html",
  styleUrls: ["./students.page.scss"],
  standalone: true,
  imports: [HesTableComponent],
})
export class StudentsPage implements OnInit {
  studentsList = this.studentService.studentsList;

  columns = signal<ITableCol<IStudentListItem>[]>([
    {
      field: "fullName",
      headerName: "Full Name",
      sortable: true,
      filter: true,
    },
    {
      field: "nationalId",
      headerName: "National ID",
      sortable: true,
      filter: true,
    },
    {
      field: "phoneNumber",
      headerName: "Phone Number",
      sortable: true,
      filter: true,
    },
  ]);

  constructor(private studentService: StudentsService) {}

  ngOnInit() {
    this.studentService.getStudentsList();
  }
}
```

Finally, Use the `app-hes-table` component in your template.

```html
<app-hes-table [rowData]="studentsList()" [columns]="columns"></app-hes-table>
```
