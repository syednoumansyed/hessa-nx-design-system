export interface SupportHubDefaultPersonnelsDTO {
  escalation: {
    id: number;
    schoolId: number;
    supportTypeId: number;
    days: number | null;
    tenantId: number;
    levelNumber: number;
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    updatedBy: number;
  };
  personnels: Array<{
    id: number;
    personnelId: number;
    ticketEscalationId: number;
    personnel: {
      id: number;
      userId: number;
      user: {
        id: number;
        arFullName: string | null;
        enFullName: string | null;
        profileColor: string | null;
      };
    };
  }>;
}
