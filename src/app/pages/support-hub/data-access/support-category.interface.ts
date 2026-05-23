import { DsIcon } from '@ds/icon/icon.component';

export interface SupportCategory {
  readonly id: number;
  readonly displayName: string;
  readonly description?: string | null;
  readonly icon: string | null;
  readonly allowPrivateRequest: boolean;
}

export interface SupportSubcategory {
  readonly id: number;
  readonly displayName: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly supportTypeId: number;
  readonly allowPrivateRequest: boolean;
}
