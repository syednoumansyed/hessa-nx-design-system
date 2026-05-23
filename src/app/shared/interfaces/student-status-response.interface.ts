export interface StudentStatusResponse {
  id: number;
  userId: number;
  status: string;
  userSuspension: {
    id: number;
    status: string;
    suspensionStatus: string;
    userId: number;
    userType: string;
    startTime: string | null;
    endTime: string | null;
    reason: string;
    createdAt: string;
    updatedAt: string | null;
  } | null;
}
