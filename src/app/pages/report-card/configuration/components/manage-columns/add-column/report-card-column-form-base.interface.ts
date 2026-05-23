import {
  ReportCardCalculatedFormPayload,
  ReportCardColumnFormPayload,
  ReportCardExistingColumnPayloadDTO,
  ReportCardHorizontalFormPayload,
  ReportCardSignalEntryFormPayload,
  SubjectWithMaxMarks,
} from '@pages/report-card/configuration/data-access/report-card-configuration.model';

type omitField = 'title' | 'reportCardId' | 'columnType' | 'id';
type ReportCardRestPayloadBase<T> = Omit<T, omitField | 'subjectIds'> & {
  subjects: SubjectWithMaxMarks[];
  subjectIds?: SubjectWithMaxMarks[];
};

export type ReportCardCalculatedRestPayload =
  ReportCardRestPayloadBase<ReportCardCalculatedFormPayload>;

export type ReportCardHorizontalRestPayload =
  ReportCardRestPayloadBase<ReportCardHorizontalFormPayload>;

export type ReportCardSignalEntryRestPayload =
  ReportCardRestPayloadBase<ReportCardSignalEntryFormPayload>;

export interface ReportCardColumnFormBase {
  getRestPayload: () =>
    | ReportCardCalculatedRestPayload
    | ReportCardHorizontalRestPayload
    | ReportCardSignalEntryRestPayload;

  patchForm: (value: ReportCardColumnFormPayload) => void;
}
