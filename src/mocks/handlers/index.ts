import { AcademicYearHandlers } from './academic-years';
import { RoleHandlers } from './roles';
import { userManagementHandlers } from './user-management';

export const handlers = [
  ...RoleHandlers,
  ...userManagementHandlers,
  ...AcademicYearHandlers,
];
