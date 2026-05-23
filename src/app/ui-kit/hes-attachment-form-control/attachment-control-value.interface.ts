export type IAttachmentControlUploadedValue = {
  extension: string;
  key: string;
  url: string;
  id?: string;
  isLink?: boolean;
  publishingDate?: string | null;
  title?: string;
  name?: string;
};
export type IAttachmentControlValue = File | IAttachmentControlUploadedValue;
