import { FormControl, FormGroup } from '@angular/forms';
import { IResponse } from '@shared/interfaces';
import { GuardianRelationship, Gender } from 'src/app/shared/enums';

export type guardianForm = FormGroup<{
  fullName: FormControl<string>;
  nationalId: FormControl<string>;
  relationship: FormControl<GuardianRelationship | null>;
  phoneNumber: FormControl<string>;
  gender: FormControl<Gender>;
}>;

export type relationshipForm = FormGroup<{
  id: FormControl<number | null>;
  relationship: FormControl<GuardianRelationship | null>;
}>;
