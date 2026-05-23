import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { Observable } from 'rxjs';

export interface MediaAttachmentConfig {
  header?: string;
  subHeader?: string;
  mediaType: 'video' | 'file';
  isEditMode?: boolean;
  titleInput?: {
    placeholder?: string;
    label?: string;
  };

  // Configuration for file attachment input
  attachmentConfig: {
    label: string;
    uploadUrl: string; // URL for uploading the attachment to S3
    isMultiple?: boolean; // Determines if multiple files can be uploaded
  };

  // Configuration for link input field (only for videos if needed)
  linkConfig?: {
    hideLinkOnAttachment?: boolean; // Determines if link input should be hidden when an attachment is provided
  };

  // Customizable toast messages for user feedback
  toastMessages?: {
    success?: string; // Message shown on successful upload
    error?: string; // Message shown on error during upload
  };

  recordUpdateCallback?: MediaAttachmentRecordUpdateCallbacks;
  // Optional callbacks for additional actions on success, error, or cancellation
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  mediaAttachmentFormData?: MediaAttachmentFormData;
}

export type MediaAttachmentRecordUpdateCallbacks = (args: {
  attachments: {
    isLink: boolean;
    name: string;
    path: string;
  }[];
}) => Observable<unknown>;

export type MediaAttachmentFormData = IAttachmentControlUploadedValue[];
