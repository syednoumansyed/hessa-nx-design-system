import { FormControl, FormGroup } from '@angular/forms';
import {
  GuardianRelationship,
  Gender,
  StudentRelationship,
} from 'src/app/shared/enums';

export type studentForm = FormGroup<{
  arFullName: FormControl<string>;
  enFullName: FormControl<string>;
  nationalId: FormControl<number | null>;
  relationship: FormControl<StudentRelationship | null>;
  phoneNumber: FormControl<string>;
  gender: FormControl<Gender>;
  nationalityId: FormControl<number | null>;
  pioneerStudentId: FormControl<string | null>;
  passportNumber: FormControl<string | null>;
  passportExpiryDate: FormControl<Date | string | null>;
  dateOfBirth: FormControl<Date | string | null>;
  registrationDate: FormControl<Date | string | null>;
  company: FormControl<number | null>;
  campus: FormControl<number | null>;
  schoolId: FormControl<number | null>;
  levelId: FormControl<number | null>;
  classId: FormControl<number | null>;
}>;

export type guardianForm = FormGroup<{
  arFullName: FormControl<string>;
  enFullName: FormControl<string>;
  nationalId: FormControl<string>;
  relationship: FormControl<GuardianRelationship | null>;
  phoneNumber: FormControl<string>;
  gender: FormControl<Gender>;
}>;

export type guardianRelationshipForm = FormGroup<{
  id: FormControl<number | null>;
  relationship: FormControl<StudentRelationship | null>;
}>;

export type relationshipForm = FormGroup<{
  id: FormControl<number | null>;
  relationship: FormControl<GuardianRelationship | null>;
}>;

export type associateSchoolForm = FormGroup<{
  company: FormControl<number | undefined>;
  subCompany: FormControl<number | undefined>;
  campus: FormControl<number | undefined>;
  school: FormControl<number | undefined>;
}>;
