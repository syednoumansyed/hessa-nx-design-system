export interface ReportCardPreviewDTO {
  data: {
    gpa: number;
    percentage: number;
  };
  table: {
    columns: ColumnDTO[];
  };
}

interface ColumnDTO {
  id: number;
  title: string;
  data?: ColumnDataDTO;
  rows: RowDTO[];
}

interface ColumnDataDTO {
  functionType: string;
  columnType: string;
  sumAggregate: boolean;
  scaleTo: null | number;
  maxMarks?: number;
}

interface RowDTO {
  id: number;
  title: string;
  titleEn: string | null;
}
