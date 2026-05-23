import {
  Component,
  TemplateRef,
  computed,
  inject,
  viewChild,
  OnInit,
  signal,
} from '@angular/core';
import type { InputCustomEvent, InputChangeEventDetail } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonInput,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { isMobile } from '@shared/utils/platform';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMinusCircle } from '@fortawesome/pro-solid-svg-icons';
import { faPlus, faMinus, faPencil } from '@fortawesome/pro-regular-svg-icons';
import { openAddNewEntryModal } from './add-entry-modal';
import { FeedbackService } from '@shared/services/feedback.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportCardService } from '../../data-access/report-card.service';
import {
  IEntriesList,
  IReportCardColumn,
  IStudentMarksList,
} from '../../data-access/report-card-course.dto';
import { forkJoin, Subject } from 'rxjs';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { CanFormComponentDeactivate } from '@shared/guards/form-can-deactivate.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { LevelsService } from '@pages/school-structure/pages/level/data-access/levels.service';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { StudentMarks } from '../../data-access/report-card-course.interface';
import { ReportCardDetail } from '@pages/report-card/configuration/data-access/report-card-configuration.interface';

interface IMarkReportCardParams {
  subjectId: number | undefined;
  subjectName: string | undefined;
  classId: number | undefined;
  className: string | undefined;
  levelIds: number[] | undefined;
  levelNames: string | undefined;
  reportCardId: number | undefined;
  reportCardTitle: string | undefined;
}
@Component({
  selector: 'app-mark-report-card',
  templateUrl: './mark-report-card.page.html',
  styleUrls: ['./mark-report-card.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    TranslocoDirective,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    IonButton,
    HesButtonModule,
    FontAwesomeModule,
    IonInput,
    RbacDirective,
  ],
})
export class MarkReportCardPage implements OnInit, CanFormComponentDeactivate {
  private readonly translateService = inject(HesTranslateService);
  private readonly nonNullablefb = inject(NonNullableFormBuilder);
  private readonly reportCardService = inject(ReportCardService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly modalCtrl = inject(ModalController);
  private readonly router = inject(Router);
  private readonly toastr = inject(HesToasterService);
  private readonly route = inject(ActivatedRoute);

  private readonly levelsService = inject(LevelsService);
  private readonly courseManagementService = inject(CourseManagementService);

  protected readonly removeIcon = faMinusCircle;
  protected readonly plusIcon = faPlus;
  protected readonly minusIcon = faMinus;
  protected readonly editIcon = faPencil;
  protected readonly editMarksPermissionId =
    RESOURCE_PERMISSION.GRADE_MANAGEMENT.TEACHER_MARKS.UPDATE_MARKS;

  private readonly onSuccessColumnSubjectEntrySource$ = new Subject<void>();
  readonly onSuccessColumnSubjectEntry$ =
    this.onSuccessColumnSubjectEntrySource$.asObservable();

  closeModal = () => this.modalCtrl.dismiss();

  isMobile = isMobile();

  readonly form = this.nonNullablefb.group({
    reportColumn: this.nonNullablefb.control(0, Validators.required),
  });

  params = signal<IMarkReportCardParams>({
    subjectId: undefined,
    subjectName: undefined,
    classId: undefined,
    className: undefined,
    levelIds: undefined,
    levelNames: undefined,
    reportCardId: undefined,
    reportCardTitle: undefined,
  });

  loadingSkeleton = signal<boolean>(false);
  columnOptions = signal<ISelectValue[]>([]);
  columnsList = signal<IReportCardColumn[]>([]);
  selectedColumnDetail = signal<IReportCardColumn | undefined>(undefined);
  reportCardDetail = signal<ReportCardDetail | null>(null); // Store report card detail from API
  entriesList = signal<IEntriesList[]>([]);
  selectedEntry = signal<IEntriesList | undefined>(undefined);
  studentMarksList = signal<IStudentMarksList[]>([]);
  originalStudentMarksList = signal<StudentMarks[]>([]);

  // Computed signal to create a mapping of columnId -> subject-specific maxMarks for current subject
  columnMaxMarksMap = computed(() => {
    const reportCard = this.reportCardDetail();
    const { subjectId } = this.params();

    if (!reportCard || !subjectId) return new Map<number, number>();

    const map = new Map<number, number>();

    // Loop through all columns in report card
    reportCard.columns?.forEach((column) => {
      // Find the subject in the column's subjects array
      const subjectData = column.subjects?.find((subject) => {
        return subject.id === subjectId;
      });

      if (subjectData?.maxMarks != null) {
        // Use subject-specific maxMarks
        map.set(column.id, subjectData.maxMarks);
      } else if (column.maxMarks != null) {
        // Fall back to global maxMarks
        map.set(column.id, column.maxMarks);
      }
    });

    return map;
  });

  protected readonly columnForm = computed<IControl>(() => {
    const optionTemplate = this.columnOptionTemplate();
    return {
      placeholder: this.translateService.t(
        'grades_management.columns_dropdown.title',
      ),
      formControlName: 'reportColumn',
      type: 'searchable-select',
      required: false,
      selectValues: this.columnOptions(),
      searchableSelectObject: {
        showClearBtn: false,
        ...(optionTemplate && {
          selectOptionTemplate: optionTemplate,
          selectedDisplayTemplate: optionTemplate,
        }),
      },
    };
  });

  columnOptionTemplate = viewChild<TemplateRef<any>>('columnOptionTemplate');

  constructor() {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    this.route.paramMap.subscribe((params) => {
      const reportCardId = Number(params.get('reportCardId'));
      const classId = Number(params.get('classId'));
      const subjectId = Number(params.get('subjectId'));
      const levelId = Number(params.get('levelId'));

      if (!reportCardId || !classId || !subjectId) {
        this.router.navigate(['/grade-management/list-courses']);
        return;
      }

      forkJoin({
        reportCard:
          this.reportCardService.getReportCardDetailForTeacher(reportCardId),
        subject: this.courseManagementService.getSubjectById(+subjectId),
        classDetails: this.reportCardService.getReportClassDetail(+classId),
      }).subscribe({
        next: ({ reportCard, subject, classDetails }) => {
          // Store report card detail for maxMarks mapping
          this.reportCardDetail.set(reportCard);

          this.params.set({
            reportCardId: reportCardId,
            reportCardTitle: reportCard.title,
            subjectId: subjectId,
            subjectName: subject.displayName,
            classId: classId,
            className: classDetails.displayName,
            levelIds: reportCard.levels.map((level) => level.id),
            levelNames: reportCard.levels
              .filter((l) => l.id === levelId)
              .map((level) => level.displayName)
              .join(', '),
          });
          this.getColumnsList();
        },
        error: () => {
          this.router.navigate(['/grade-management/list-courses']);
        },
      });
    });

    this.form.get('reportColumn')?.valueChanges.subscribe((val) => {
      this.hanldeColumnChange(val);
    });

    this.onSuccessColumnSubjectEntry$.subscribe(() => {
      this.getColumnSubjectEntriesList(() => {
        if (this.entriesList().length) {
          // set the last added entry as selected
          this.handleSelectSubjectEntry(
            this.entriesList()[this.entriesList().length - 1],
          );
        }
      });
    });
  }

  onMarksInput(
    event: InputCustomEvent<InputChangeEventDetail>,
    maxMarks: number,
  ) {
    const inputEl = event.target as HTMLIonInputElement;
    const rawValue = event.detail.value;
    const newValue = parseFloat(rawValue ?? '');

    if (!isNaN(newValue) && newValue > maxMarks) {
      inputEl.value = String(maxMarks);
    } else if (!isNaN(newValue) && newValue < 0) {
      inputEl.value = '0';
    }
  }

  onMarksChange(
    event: InputCustomEvent<InputChangeEventDetail>,
    studentId: number,
  ) {
    const inputEl = event.target as HTMLIonInputElement;
    const rawValue = event.detail.value;
    const newValue = parseFloat(rawValue ?? '');

    const updatedStudentMarksList = this.studentMarksList().map((student) => {
      if (student.studentId === studentId) {
        if (isNaN(newValue) || newValue < 0 || newValue > student.maxMarks) {
          inputEl.value = String(student.marks ?? student.maxMarks);
          return student;
        }

        return {
          ...student,
          marks: newValue,
        };
      }
      return student;
    });

    this.studentMarksList.set(updatedStudentMarksList);
  }

  onMarksAdd(studentId: number) {
    const updatedStudentMarksList = this.studentMarksList().map((student) => {
      if (student.studentId === studentId) {
        const currentMarks = Number(student.marks ?? student.maxMarks);
        const newMarks = Math.min(currentMarks + 1, student.maxMarks);
        return {
          ...student,
          marks: newMarks,
        };
      }
      return student;
    });
    this.studentMarksList.set(updatedStudentMarksList);
  }

  onMarksSubtract(studentId: number) {
    const updatedStudentMarksList = this.studentMarksList().map((student) => {
      if (student.studentId === studentId) {
        const currentMarks = Number(student.marks ?? student.maxMarks);
        const newMarks = Math.max(currentMarks - 1, 0);
        return {
          ...student,
          marks: Math.round(newMarks * 100) / 100,
        };
      }
      return student;
    });

    this.studentMarksList.set(updatedStudentMarksList);
  }

  onChangeToEditing(studentId: number) {
    const updatedStudentMarksList = this.studentMarksList().map((student) => {
      if (student.studentId === studentId) {
        return {
          ...student,
          isEditing: !student.isEditing,
        };
      }
      return student;
    });
    this.studentMarksList.set(updatedStudentMarksList);
  }

  onAddNewEntry() {
    const { reportCardColumnSubjectId, id } = this.selectedColumnDetail() || {};
    if (!reportCardColumnSubjectId || !id) {
      return;
    }
    openAddNewEntryModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      reportCardColumnSubjectId,
      reportCardColumnId: id,
      onRefresh: this.onSuccessColumnSubjectEntrySource$,
    });
  }

  async onDeleteEntryClick(id: number) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translateService.t(
          'grade_management.delete_entry.title',
          {
            Name: this.selectedEntry()?.title,
          },
        ),
        modalMessage: this.translateService.t(
          'grade_management.delete_entry.txt',
        ),
        primaryBtnStr: this.translateService.t(
          'grade_management.confirm_delete.btn',
        ),
        secondaryBtnStr: this.translateService.t('global.cancel.btn'),
      },
      () => {
        this.onDelete(id);
      },
    );
  }

  onEditSubjectEntry() {
    const { id, title } = this.selectedEntry() || {};
    if (!id) {
      return;
    }
    openAddNewEntryModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      entryId: id,
      entryTitle: title,
      onRefresh: this.onSuccessColumnSubjectEntrySource$,
    });
  }

  handleSelectSubjectEntry(entry: IEntriesList) {
    this.selectedEntry.set(entry);

    // set entry as active
    const updatedEntriesList = this.entriesList().map((item) => ({
      ...item,
      isActive: item.id === entry.id,
    }));
    this.entriesList.set(updatedEntriesList);

    // return if active entry is clicked again
    if (entry.isActive) {
      return;
    }

    this.getStudentMarksList();
  }

  navigateBack() {
    this.router.navigate(['/grade-management/list-courses']);
  }

  onSaveMarks() {
    const { id } = this.selectedEntry() || {};
    const reportCardColumnId = this.selectedColumnDetail()?.id;
    if (!id || !reportCardColumnId) {
      return;
    }

    const studentMarks = this.studentMarksList()
      .map((student) => ({
        studentId: student.studentId,
        marks: student.marks ?? student.maxMarks,
      }))
      .filter((student) => {
        const originalStudent = this.originalStudentMarksList().find(
          (orig) => orig.studentId === student.studentId,
        );
        return originalStudent && student.marks !== originalStudent.marks;
      });

    if (studentMarks.length === 0) {
      return this.toastr.error(
        this.translateService.t('grade_management.no_changes_to_save.txt'),
      );
    }

    this.reportCardService
      .createSubjectEntryMarks(id, reportCardColumnId, studentMarks)
      .subscribe({
        next: () => {
          this.toastr.success(
            this.translateService.t(
              'grade_management.marks_updated_successfully.txt',
            ),
          );
          this.getStudentMarksList();

          // set entry as saved
          const updatedEntriesList = this.entriesList().map((item) => ({
            ...item,
            isMarksSaved: item.id === id ? true : item.isMarksSaved,
          }));
          this.entriesList.set(updatedEntriesList);
        },
        error: (errResp) => {
          this.toastr.showBackendError(errResp);
        },
      });
  }

  validateSaveBtn() {
    // return true if getStudentMarksList has entries and any of them isEditing
    return (
      this.studentMarksList().length > 0 &&
      this.studentMarksList().some((student) => student.isEditing)
    );
  }

  isUnsavedChanges() {
    return this.entriesList().some((entry) => !entry.isMarksSaved);
  }

  private onDelete(id: number) {
    const { classId } = this.params();
    const reportCardColumnId = this.selectedColumnDetail()?.id;
    if (!classId || !reportCardColumnId) {
      return;
    }
    this.reportCardService
      .deleteColumnSubjectEntryById(id, reportCardColumnId, { classId })
      .subscribe({
        next: () => {
          this.getColumnSubjectEntriesList(() => {
            if (this.entriesList().length) {
              this.handleSelectSubjectEntry(this.entriesList()[0]);
            }
          });
          this.toastr.success(
            this.translateService.t(
              'grade_management.entry_deleted_successfully.txt',
            ),
          );
        },
        error: (errResp) => {
          this.toastr.showBackendError(errResp);
        },
      });
  }

  private getStudentMarksList() {
    this.loadingSkeleton.set(true);

    const { id } = this.selectedEntry() || {};

    const { classId, reportCardId } = this.params();
    if (!classId || !id || !reportCardId) {
      return;
    }

    this.reportCardService
      .getColumnSubjectEntryById(id, {
        classId,
        reportCardId,
      })
      .subscribe((resp) => {
        this.originalStudentMarksList.set(resp.studentsMarks);
        const selectedColumn = this.selectedColumnDetail();

        // Get maxMarks from the computed map (subject-specific or global)
        const effectiveMaxMarks =
          this.columnMaxMarksMap().get(selectedColumn?.id ?? 0) ?? 0;

        const mappedStudentsMarksList = resp.studentsMarks.map((student) => ({
          studentId: student.studentId,
          fullName: student.displayName,
          marks: student.marks,
          maxMarks: effectiveMaxMarks,
          isEditing: student.marks === null,
        }));
        this.studentMarksList.set(mappedStudentsMarksList);
        this.loadingSkeleton.set(false);
      });
  }

  private hanldeColumnChange(val: number) {
    if (!val) {
      this.selectedColumnDetail.set(undefined);
      this.entriesList.set([]);
      this.studentMarksList.set([]);
      this.selectedEntry.set(undefined);
      return;
    }

    const column = this.columnsList().find((col) => col.id === +val);
    this.selectedColumnDetail.set(column ?? undefined);
    this.getColumnSubjectEntriesList(() => {
      if (this.entriesList().length) {
        this.handleSelectSubjectEntry(this.entriesList()[0]);
      }
    });
  }

  private getColumnsList() {
    const { classId, subjectId, reportCardId } = this.params();

    if (
      classId === undefined ||
      subjectId === undefined ||
      reportCardId === undefined
    ) {
      return;
    }

    this.reportCardService
      .getTeacherColumns({ classId, subjectId, reportCardId })
      .subscribe((resp) => {
        const columns = resp.map((column) => {
          const status = column.status ?? null;
          return {
            value: column.id,
            displayedValue: column.title,
            extraData: {
              status,
              statusLabel:
                status === 'UPDATED'
                  ? this.translateService.globalTObj.update
                  : status,
            },
          } satisfies ISelectValue;
        });
        this.columnOptions.set(columns);
        this.columnsList.set(resp);

        // set first column as selected
        if (columns.length) {
          this.form.get('reportColumn')?.setValue(columns[0].value);
        }
      });
  }

  private getColumnSubjectEntriesList(done?: () => void) {
    const { reportCardColumnSubjectId } = this.selectedColumnDetail() || {};
    if (!reportCardColumnSubjectId) {
      return;
    }
    this.reportCardService
      .getColumnSubjectEntries({ reportCardColumnSubjectId })
      .subscribe((resp) => {
        const mappedList = resp.map((item) => ({
          id: item.id,
          title: item.title,
          isActive: false,
          isMarksSaved: item.isMarksSaved,
        }));
        this.entriesList.set(mappedList);
        this.studentMarksList.set([]);
        done?.();
      });
  }
}
