// DTO interfaces that match the API response
export interface DelegateDTO {
  id: number;
  enFullName: string;
  arFullName: string;
  nationalId: string;
  key: string | null;
  url: string | null;
  expiryDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  students: DelegateStudentDTO[];
  qrCode?: string;
  guardianId: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface DelegateStudentDTO {
  id: number;
  studentId: number;
  arFullName: string;
  enFullName: string;
  levelId: number;
  arLevelName: string;
  enLevelName: string;
  classId: number;
  arClassName: string;
  enClassName: string;
}
