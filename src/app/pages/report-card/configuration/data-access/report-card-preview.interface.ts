export interface ReportCardPreview {
  data: {
    gpa: number;
    percentage: number;
  };
  table: {
    columns: Column[];
  };
}

interface Column {
  id: number;
  title: string;
  data: ColumnData | null;
  rows: Row[];
}

interface ColumnData {
  functionType: string;
  columnType: string;
  sumAggregate: boolean;
  scaleTo: null | number;
  maxMarks?: number;
}

interface Row {
  id: number;
  displayTitle: string;
}
