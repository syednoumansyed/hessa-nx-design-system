// LocalizedEntity interface for all entities with localization fields
export interface LocalizedEntity {
  displayName: string;
  arName: string;
  enName: string;
}

export interface FullNameLocalizedEntity {
  arFullName: string;
  enFullName: string;
  displayName: string;
}

export interface NameLocalizedEntityDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface FullNameLocalizedEntityDTO {
  id: number;
  arFullName: string;
  enFullName: string;
}
