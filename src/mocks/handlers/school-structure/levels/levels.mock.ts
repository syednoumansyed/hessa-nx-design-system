import { IResponse } from '@shared/interfaces';
import { ILevel } from '@shared/interfaces/level.interface';

export const LevelsMockResponse: IResponse<ILevel[]> = {
  message: '',
  data: [
    {
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
      classes: [],
      schoolLevelId: 1,
      schoolId: 1,
      hasAccess: true,
      levelId: 1,
    },
    {
      id: 2,
      name: 'Level 2',
      tenantId: 123,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: undefined,
      updatedBy: 789,
      classes: [],
      schoolLevelId: 2,
      schoolId: 2,
      hasAccess: true,
      levelId: 2,
    },
    {
      id: 3,
      name: 'Level 3',
      tenantId: 123,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: undefined,
      updatedBy: 789,
      classes: [],
      schoolLevelId: 3,
      schoolId: 3,
      hasAccess: true,
      levelId: 3,
    },
  ],
};
