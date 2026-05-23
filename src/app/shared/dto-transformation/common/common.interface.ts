import { UserProfileColors, UserType } from '@shared/enums';
import {
  FullNameLocalizedEntity,
  LocalizedEntity,
} from '../shared/localized-entity.interface';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { Idropdown } from '@shared/interfaces';

export interface CreatedBy {
  id: number;
  displayName: string;
}

export interface UpdatedBy {
  id: number;
  displayName: string;
}

export interface Nationality extends LocalizedEntity {
  id: number;
}

export interface UserEvent {
  id: number;
  userId: number;
  eventType: string;
  createdAt: string;
  tenantId: number;
}

export interface NameLocalizedIdentifiable extends LocalizedEntity {
  id: number;
}

export interface FullNameLocalizedIdentifiable extends FullNameLocalizedEntity {
  id: number;
}

export interface ConnectedProfile {
  id: number;
  displayName: string;
  countryCode: string;
  phoneNumber: string;
  nationalId: string;
  type: UserType;
  profileColor?: UserProfileColors;
}

export interface GlobalClass extends ISelectValue, Idropdown {
  id: number;
  arName: string;
  enName: string;
}
