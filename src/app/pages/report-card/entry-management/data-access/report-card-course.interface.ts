import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';

export interface ReportCardCourse {
  class: DisplayIdentifiable;
  course: ReportCourse;
  subject: DisplayIdentifiable;
  level: DisplayIdentifiable;
  school: DisplayIdentifiable;
  academicYear: DisplayIdentifiable;
  semesters: DisplayIdentifiable[];
  reportCard: ReportCard;
  lastEntry: Array<{
    createdAt: string;
    id: number;
    studentId: number;
    updatedAt: string;
  }>;
}

interface ReportCourse {
  id: number;
  status: string;
  personnelId: number;
}

interface ReportCard {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  academicYearId: number;
  semesterId: number | null;
}

export interface ColumnSubjectEntry {
  id: number;
  isMarksSaved: boolean;
  reportCardColumnSubjectId: number;
  title: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface StudentMarks {
  studentId: number;
  displayName: string;
  marks: number | null;
}

export interface ColumnSubjectEntryByIdResponse extends ColumnSubjectEntry {
  studentsMarks: StudentMarks[];
}
