/**
 * DTO interfaces for the Delegate Scan API responses
 * These match the API response structure exactly
 */

export interface DelegateStudentDTO {
  studentId: number;
  id: number;
  arFullName: string;
  enFullName: string;
  levelId: number;
  arLevelName: string;
  enLevelName: string;
  classId: number;
  arClassName: string;
  enClassName: string;
  pickupStatus: string | null;
  attendanceStatus: string | null;
  url: string | null;
}

export interface DelegateScanResponseDTO {
  id: number;
  arFullName: string;
  enFullName: string;
  expiryDate: string | null;
  nationalId: string;
  guardianId: number;
  key: string | null;
  url?: string | null;
  status: string;
  students: DelegateStudentDTO[];
  isRequestAllowed: boolean;
}
