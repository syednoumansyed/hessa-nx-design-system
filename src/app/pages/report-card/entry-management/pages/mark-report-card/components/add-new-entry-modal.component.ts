import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit } from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { ICreateColumnSubjectEntry } from '@pages/report-card/entry-management/data-access/report-card-course.dto';
import { ReportCardService } from '@pages/report-card/entry-management/data-access/report-card.service';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { isMobile } from '@shared/utils/platform';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-add-new-entry-modal',
  standalone: true,
  templateUrl: './add-new-entry-modal.component.html',
  imports: [
    TranslocoDirective,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    IonButton,
    HesButtonModule,
    IonSpinner,
  ],
})
export class AddNewEntryComponent implements OnInit {
  @Input() reportCardColumnId: number;
  @Input() reportCardColumnSubjectId: number;
  @Input() closeModal: () => void;
  @Input() onRefresh: Subject<void>;
  @Input() entryId?: number;
  @Input() entryTitle?: string;

  private readonly translateService = inject(HesTranslateService);
  private readonly nonNullablefb = inject(NonNullableFormBuilder);
  private readonly reportCardService = inject(ReportCardService);
  private readonly toastr = inject(HesToasterService);

  isMobile = isMobile();
  isLoading = false;
  isEdit = computed(() => !!this.entryId);
  readonly faClose = faClose;

  readonly form = this.nonNullablefb.group({
    title: this.nonNullablefb.control('', Validators.required),
  });

  protected readonly entryForm = computed<IControl>(() => ({
    label: this.translateService.t('grade_management.entry_title.title'),
    placeholder: this.translateService.t(
      'grade_management.enter_title.placeholder',
    ),
    formControlName: 'title',
    type: 'input',
    required: true,
  }));

  ngOnInit() {
    if (this.entryId && this.entryTitle) {
      this.form.patchValue({
        title: this.entryTitle,
      });
    }
  }

  onAddNewEntry() {
    const title = this.form.get('title')?.value;
    if (!title) {
      return;
    }
    const newEntry: ICreateColumnSubjectEntry = {
      reportCardColumnId: this.reportCardColumnId,
      reportCardColumnSubjectId: this.reportCardColumnSubjectId,
      title,
    };
    this.isLoading = true;
    this.reportCardService.createColumnSubjectEntry(newEntry).subscribe({
      next: () => {
        this.toastr.success(
          this.translateService.t(
            'grade_management.entry_added_successfully.txt',
          ),
        );
        this.onRefresh.next();
        this.closeModal();
        this.form.reset();
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.showBackendError(error);
      },
    });
  }

  onUpdateEntry() {
    const title = this.form.get('title')?.value;
    if (!title || !this.entryId) {
      return;
    }
    this.isLoading = true;
    this.reportCardService
      .updateColumnSubjectEntry(this.entryId, title)
      .subscribe({
        next: () => {
          this.toastr.success(
            this.translateService.t(
              'grade_management.entry_updated_successfully.txt',
            ),
          );
          this.onRefresh.next();
          this.closeModal();
          this.form.reset();
          this.isLoading = false;
        },
        error: (error) => {
          this.toastr.showBackendError(error);
        },
      });
  }
}
