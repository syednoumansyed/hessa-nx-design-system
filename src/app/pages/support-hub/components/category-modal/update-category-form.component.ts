import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  inject,
} from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  UserInfoPillComponent,
  UserInfoPillData,
} from '@pages/support-hub/components/user-info-pill/user-info-pill.component';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons';
import { DsSelectComponent } from '@ds/select/select.component';
import {
  FormsModule,
  ReactiveFormsModule,
  NonNullableFormBuilder,
} from '@angular/forms';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

@Component({
  selector: 'app-update-category-form',
  standalone: true,
  templateUrl: './update-category-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DsButtonComponent,
    DsIconComponent,
    UserInfoPillComponent,
    DsSelectComponent,
    FormsModule,
    ReactiveFormsModule,
    DsTranslatePipe,
  ],
})
export class UpdateCategoryFormComponent {
  readonly categoryTitle = input.required<string>();
  readonly subcategoryTitle = input.required<string>();
  readonly campusName = input<string>('');
  readonly schoolName = input<string>('');
  // New: assignees provided from parent (default personnel), mapped to pill data
  readonly assigneesPills = input<UserInfoPillData[]>([]);
  readonly isSubmitting = input<boolean>(false);

  faChevronDown = faChevronDown;

  readonly formSubmit = output<void>();
  readonly formCancel = output<void>();
  // New navigation outputs
  readonly goToCategory = output<void>();
  readonly goToSubcategory = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly categoryCtrl = this.fb.control<string>('selected');
  readonly subcategoryCtrl = this.fb.control<string>('selected');

  protected handleSubmit(): void {
    this.formSubmit.emit();
  }

  protected handleCancel(): void {
    this.formCancel.emit();
  }
}
