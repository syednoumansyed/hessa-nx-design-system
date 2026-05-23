export interface SupportCustomField {
  readonly id: number;
  readonly labelDisplayName: string;
  readonly descriptionDisplayName: string | null;
  readonly isRequired: boolean;
  readonly arLabel: string;
  readonly enLabel: string;
  readonly arDescription: string | null;
  readonly enDescription: string | null;
}
