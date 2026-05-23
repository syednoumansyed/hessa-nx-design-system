import { IResponse } from '@shared/interfaces';
import { ILevel } from '@shared/interfaces/level.interface';

export const LevelMockResponse: IResponse<ILevel> = {
  message: '',
  data: {
    id: 1,
    name: 'Level 1',
    tenantId: 123,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: {
      id: 123,
      fullName: 'John Doe',
    },
    updatedBy: 789,
    schoolLevelId: 1,
    schoolId: 1,
    hasAccess: true,
    levelId: 1,
  },
};
