import {
  IPaginatedResponse,
  IResponse,
} from '@shared/interfaces/api.interface';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

export interface RecodingDTO {
  id: number;
  date: string;
  attachments: IAttachmentControlUploadedValue[];
}
export type VCRRecordingsResponseDTO = IResponse<RecodingDTO[]>;
export type VCRRecordingResponseDTO = IResponse<RecodingDTO>;
export interface VCRLectureDTO {
  id: number;
  lecture: {
    id: number;
    startTime: string;
    lectureId: number;
    endTime: string;
    dayOfWeek: number;
    periodNumber: number;
  };
  date: string;
  lastUploadedTitle: string;
  lastUploadedOn: string;
  recordingStatus: RecordingStatus;
  enableUploadButton: boolean;
}

export type RecordingStatus = 'PENDING' | 'UPLOADED';

export type VCRLecturesResponseDTO = IResponse<VCRLectureDTO[]>;

export interface LectureRecordingUploadPayload {
  attachments: Array<{
    path: string;
    isLink: boolean;
    name: string;
  }>;
}

export interface UpdateUploadTitlePayload {
  title: string;
}
