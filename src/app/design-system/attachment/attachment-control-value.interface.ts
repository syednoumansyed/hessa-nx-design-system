export type DsAttachmentControlUploadedValue = {
  extension: string;
  key: string;
  url: string;
  id?: string;
  isLink?: boolean;
  publishingDate?: string | null;
  title?: string;
  name?: string;
  viewStatus?: string;
};
export type DsAttachmentControlValue = File | DsAttachmentControlUploadedValue;
