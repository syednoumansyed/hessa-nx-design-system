# using date input components

there are three types of date inputs you can use with form control generator

1. date input
2. date time input
3. date range input

## date input

1. create form group with date control that takes value type of Date or null

   ```typescript
   studentForm = this.fb.group({
      ...
      dateOfBirth: this.fb.control<Date | null>(
         null,
         Validators.required,
      ),
      ...
   });
   ```

   snippet taken from
   [student-form.page.ts](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/user-management/students/student-form/student-form.page.ts#L122-L175)

2. create your form control config object

   ```typescript
     studentDetailsFormConfig = computed<IControl[]>(() => {
    return [
    ...
      {
        label: this.translocoService.translate('global.date_of_birth.label'),
        placeholder: this.translocoService.translate(
          'global.date_of_birth.placeholder',
        ),
        type: 'date',
        formControlName: 'dateOfBirth',
        required: true,
      },
   ...
    ];
   });
   ```

   snippet taken from
   [student-form.page.ts](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/user-management/students/student-form/student-form.page.ts#L225-L408)

3. add form control generator component to your template

   ```jsx
   <div class="grid grid-cols-1 gap-8 gap-y-10 self-stretch md:grid-cols-2">
     @for(control of studentDetailsFormConfig(); track control.formControlName) {
     <div class="flex-1">
       <app-form-control-generator [control]="control"></app-form-control-generator>
     </div>
     }
   </div>
   ```

   snippet taken from
   [student-form.page.html](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/user-management/students/student-form/student-form.page.html#L16-L27)

4. update form control value programmatically (optional)

   ```typescript
    this.studentForm.patchValue({
      ...
      // given that date of birth is a Date in ISO format
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
      ...
    });
   ```

   snippet taken from
   [student-form.page.ts](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/user-management/students/student-form/student-form.page.ts#L490-L525)

5. prepare form control value for submission

   ```typescript
     private populateStudentPayload() {
    const formVal = this.studentForm.getRawValue();
    const studentPayload: IStudentPayload = {
      ...
      dateOfBirth: formatDateToUnix(
        (formVal.dateOfBirth! as Date).toISOString(),
      ),
      ...
    };
    return studentPayload;
   }
   ```

   snippet taken from
   [private populateStudentPayload()](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/user-management/students/student-form/student-form.page.ts#L566-L625)

## date time input

1. create form group with date control that takes value type of Date or null

   ```typescript
     form = this.fb.group({
      ...
      startDate: this.fb.control<Date | null>(null, Validators.required),
      dueDate: this.fb.control<Date | null>(null, Validators.required),
      ...
   });
   ```

   snippet taken from
   [form = this.fb.group({](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/course-management/pages/add-exam/add-exam.page.ts#L87-L96)

2. create your form control config object

   ```typescript
   additionalFieldsConfig = computed<IControl[]>(() => {
         ...
      return [
        {
          label: this.translocoService.translate(
            'content_management.start_date_time.label',
          ),
          type: 'date-time',
          placeholder: 'Choose start date and time', //todo: Replace with translation once available
          formControlName: 'startDate',
          required: true,
        },
        {
          label: this.translocoService.translate(
            'content_management.due_date_time.label',
          ),
          placeholder: 'Choose due date and time', //todo: Replace with translation once available
          type: 'date-time',
          formControlName: 'dueDate',
          required: true,
        },
         ...
      ];
         ...
   });
   ```

   snippet taken from
   [additionalFieldsConfig = computed<IControl[]>(() => {](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/course-management/pages/add-exam/add-exam.page.ts#L98-L176)

3. add form control generator component to your template

   ```jsx
    <div class="flex w-full flex-col gap-8 gap-y-10">
      @for ( control of formConfig(); track control.formControlName ) {
         <div class="flex-1">
            <app-form-control-generator
               [control]="control"
            ></app-form-control-generator>
         </div>
      }
   </div>
   ```

   snippet taken from
   [add-exam.page.html](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/course-management/pages/add-exam/add-exam.page.html#L51-L59)

4. update form control value programmatically (optional)

   ```typescript
   this.form.patchValue({
         ...
      startDate: exam.startDate ? new Date(exam.startDate) : null,
      dueDate: exam.dueDate ? new Date(exam.dueDate) : null,
         ...
    });
   ```

   snippet taken from
   [add-exam.page.ts](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/course-management/pages/add-exam/add-exam.page.ts#L285-L294)

5. prepare form control value for submission

   ```typescript
    const payload: AddExamPayloadDTO = {
         ...
        startDate: data.startDate
          ? formatDateToUnixWithTime((data.startDate! as Date).toISOString())
          : 0,
        dueDate: formatDateToUnixWithTime(
          (data.dueDate! as Date).toISOString(),
        ),
         ...
      };
   ```

   snippet taken from
   [const payload: AddExamPayloadDTO = {](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/course-management/pages/add-exam/add-exam.page.ts#L336-L350)

## date range input

1. create form group with daterange control that takes value type of `{from: Date, to: Date}` or null

   ```typescript
   dateRangeForm = this.formBuilder.group<{
     dateRange: { from: Date; to: Date };
   }>({
     // in this case we wanted to initialize both ranges with today's
     dateRange: { from: new Date(), to: new Date() },
   });
   ```

   snippet taken from
   [form = this.fb.group({](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/course-management/pages/add-exam/add-exam.page.ts#L87-L96)

2. create your form control config object

   ```typescript
   dateRangeControl: IControl = {
     type: "date-range",
     formControlName: "dateRange",
     placeholder: "From - To",
     required: false,
   };
   ```

   snippet taken from
   [student.attendance.page.ts](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/attendance/pages/student-attendance/student-attendance.page.ts#L141-L146)

3. add form control generator component to your template

   ```jsx
    <form [formGroup]="dateRangeForm">
      <app-form-control-generator
      [control]="dateRangeControl"
      ></app-form-control-generator>
   </form>
   ```

   snippet taken from
   [add-exam.page.html](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/attendance/pages/student-attendance/student-attendance.page.html#L61-L65)

4. prepare form control value for submission

   ```typescript
   // in this case the BE API expects dates in yyyy-MM-dd format
   this.dateRangeForm.valueChanges.subscribe(({ dateRange }) => {
     this.studentAttendanceService.updateSelectedStartDate(formatDate(dateRange!.from, "yyyy-MM-dd"));
     this.studentAttendanceService.updateSelectedEndDate(formatDate(dateRange!.to, "yyyy-MM-dd"));
     this.populateStudentAttendance();
   });
   ```

   snippet taken from
   [student-attendance.page.ts](https://github.com/ncle-edu/hessa-fe/blob/fa5c4eb1960acebefd1dfdec33f4adf66a9b6c9f/src/app/pages/attendance/pages/student-attendance/student-attendance.page.ts#L223-L231)

# Formatting Dates in UI and TypeScript Files

## Introduction

In this guide, we will explain how to format dates in the user interface (UI) using our `HesDatePipe` and in TypeScript (TS) files using our `dates` utility.

## Formatting Dates in UI using HesDatePipe

To format dates in the UI, we can use the `HesDatePipe` provided by our application. The `HesDatePipe` is a custom pipe that allows us to format dates according to our requirements.

To use the `HesDatePipe`, follow these steps:

1. Import the `HesDatePipe` in the component where you want to format the date:

   ```typescript
   import { HesDatePipe } from "@shared/pipes/hesa-date.pipe";
   ```

2. Add it to the `imports` array in your componenet decorator:

   ```typescript
   @Component({
     standalone: true,
     imports: [HesDatePipe],
   })
   ```

3. Use the `HesDatePipe` in the template to format the date:

   ```html
   <p>{{ myDate | hesDate }}</p>
   ```

   Replace `myDate` with the date variable you want to format.

## Formatting Dates in TypeScript Files using dates util

In TypeScript files, we can use our `dates` utility to format dates. The `dates` utility provides various methods to format dates according to our requirements.

### Formatting dates for APIs

1. Import the `formatAPIDate` utility in the TypeScript file where you want to format the date:

   ```typescript
   import { formatAPIDate } from "@utils/date";
   ```

2. Use the desired method from the `dates` utility to format the date:

   ```typescript
   const formattedDate = formatAPIDate(myDate);
   ```

   Replace `myDate` with the date variable you want to format.

### Formatting dates for Display

1. Import the `formatToHesDate` utility in the TypeScript file where you want to format the date:

   ```typescript
   import { formatToHesDate } from "@utils/date";
   ```

2. Use the desired method from the `dates` utility to format the date:

   ```typescript
   const formattedDate = formatToHesDate(myDate);
   ```

   Replace `myDate` with the date variable you want to format.

## Conclusion

By following the steps mentioned above, you can easily format dates in the UI using our `HesDatePipe` and in TypeScript files using our `dates` utility. This allows you to display dates in a user-friendly format according to our application's requirements.
