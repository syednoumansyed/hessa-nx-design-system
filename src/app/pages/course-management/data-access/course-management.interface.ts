export interface CourseManagement {
  id: number;
  subject: {
    id: number;
    displayName: string;
  };
  personnel: {
    id: number;
    displayName: string;
  };
  lectures: Array<{
    dayOfWeek: number;
    endTime: string;
    id: number;
    periodId: number;
    periodNumber: number;
    startTime: string;
  }>;
  academicYear: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  company: {
    id: number;
    displayName: string;
  };
  campus: {
    id: number;
    displayName: string;
  };
  school: {
    id: number;
    displayName: string;
  };
  level: {
    id: number;
    displayName: string;
  };
  class: {
    id: number;
    displayName: string;
  };
  status: string;
  creditHour: number;
  hasContents: boolean;
}

export interface CourseSubject {
  id: number;
  displayName: string;
  displayedValue: string;
  value: number;
}
