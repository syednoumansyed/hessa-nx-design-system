import { EducationalPathEnum } from '@shared/enums';
import { IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';

export interface LetterGrade {
  id?: ObjId;
  gradeLetter: string;
  numericGrade: string;
  minValue: string;
  maxValue: string;
  gradeScaledId?: ObjId;
}
export interface LetterGradeScalesPayload {
  academicYearId: ObjId;
  educationalPath: EducationalPathEnum;
  grades: LetterGrade[];
}

export interface LetterGradeSaclesUpdatePayload {
  grade?: LetterGrade;
  grades?: LetterGrade[];
}

export interface LetterGradeScaleDTO {
  id: ObjId;
  academicYear: {
    id: ObjId;
    name: string;
  };
  educationalPath: EducationalPathEnum;
  createdAt: string;
  updatedAt: string;
  grades: LetterGrade[];
}

export type LetterGradeScaleResponseDTO = IResponse<LetterGradeScaleDTO>;

export type LetterGradeScaleListResponseDTO = IResponse<LetterGradeScaleDTO[]>;

export type GradeScaleParams = {
  academicYearId?: ObjId;
  educationalPath?: EducationalPathEnum;
};
