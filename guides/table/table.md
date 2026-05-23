# Using HesTableComponent as a Standalone Component

This guide shows you how to use `HesTableComponent` as a standalone component in your Angular application.

## table of content

- [Basic Usage](#basic-usage)
- [Listing Serverside](./listing-server-side.md)
- [Full Example](./full-example.md)

## Basic Usage

1. import `HesTableComponent` from your components folder:

   ```typescript
   import { HesTableComponent } from "@components/hes-table/hes-table.component";
   import { ITableCol, ITableModel } from "@components/hes-table/model";
   ```

2. Declare HesTableComponent in your standalone component:

   ```typescript
   @Component({
     standalone: true,
     imports: [HesTableComponent],
   })
   export class YourComponent {}
   ```

3. Define your table columns

   ```typescript
   rows: T[] = [...data];

   columns: ITableCol<T>[] = [
   { field: "name", headerName: "Name", sortable: true, filter: true },
   { field: "age", headerName: "Age", sortable: true, filter: true },
   { field: "dob", headerName: "Date of Birth", sortable: true, filter: true },
   ];

   ```

   `T` represents the type of your data objects that is going to be listed

   `columns` is an array of `ITableCol` objects, where each object represents a column in the table.

   Each object in the columns array should have the following properties:

   | Property   | Description                                                                                                           |
   | ---------- | --------------------------------------------------------------------------------------------------------------------- |
   | field      | The property of the data objects to be displayed in this column. this value should exist as a key in your data object |
   | headerName | The header title of the column.                                                                                       |
   | sortable   | is this column sortable or not                                                                                        |
   | filter     | is this column filterable or not                                                                                      |

4. use the `app-hes-table` component in your template. Here's an example:

   ```html
   <app-hes-table [rowData]="rows" [columns]="columns"></app-hes-table>
   ```

   In this example, rows is a property of your component that contains the data to be displayed in the table. You need to replace it with your actual data property populated from server.

## Filtering (Server side)

### Using the `filterChanged` Event Emitter

The `filterChanged` event emitter is used to emit events when any of the table filters value changes in the `HesTableComponent`.

### Basic Usage

First, add the `app-hes-table` component in your template and bind the `filterChanged` event to a method in your component:

```html
<app-hes-table (filterChanged)="onFilterChanged($event)"></app-hes-table>
```

In this example, onFilterChanged is a method in your component that gets called when the filterChanged event is emitted. You need to replace onFilterChanged with your actual method.

Then, define the onFilterChanged method in your component:

```typescript
onFilterChanged(filter: ITableFilter) {
    // Handle the filter change.
    console.log('Filter changed:', filter);
}
```

In this example, filter is the new filter value. The onFilterChanged method logs the new filter value to the console. You need to replace the console log statement with your actual code to handle the filter change.

## Sorting (Server side)

### Using the `sortChanged` Event Emitter

The `sortChanged` event emitter is used to emit events when any of the table columns sort order changes in the `HesTableComponent`.

### Basic Usage

First, add the `app-hes-table` component in your template and bind the `filterChanged` event to a method in your component:

```html
<app-hes-table (sortChanged)="onSortChanged($event)"></app-hes-table>
```

In this example, `onSortChanged` is a method in your component that gets called when the `sortChanged` event is emitted. You need to replace `onSortChanged` with your actual method.

Then, define the `onsortChanged` method in your component:

```typescript
onSortChanged(event: ITableSort | null) {
    // Handle the sort change.
    console.log('Sorting changed:', event);
}
```

In this example, event is the new sort value. The `onSortChanged` method logs the new `sort` value to the console. You need to replace the console log statement with your actual code to handle the sort change.

## Pagination (Server side)
