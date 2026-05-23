export interface SupportCategoryDTO {
  readonly id: number;
  readonly arName: string;
  readonly enName: string;
  readonly arDescription: string | null;
  readonly enDescription: string | null;
  readonly key: string | null;
  readonly icon: string | null;
  readonly tenantId: number;
  readonly accessLevel: 'PUBLIC' | 'INTERNAL';
  readonly allowPrivateRequest?: boolean;
  readonly isForArticle?: boolean;
  readonly isForTicket?: boolean;
  readonly supportTypeId?: number;
}
