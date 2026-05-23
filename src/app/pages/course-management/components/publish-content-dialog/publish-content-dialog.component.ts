import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ContentPublishService } from '@pages/course-management/data-access/content-publish.service';
import { first, Observable } from 'rxjs';
import {
  ContentPublishDTO,
  PublishPayload,
} from '@pages/course-management/data-access/content-publish.dto';
import { IResponse } from '@shared/interfaces';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { faCircleExclamation } from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FaIconComponentsProps } from '@shared/types';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ContentPublish } from '@pages/course-management/data-access/content-publish.interface';

@Component({
  selector: 'app-publish-content-dialog',
  templateUrl: './publish-content-dialog.component.html',
  imports: [
    FaIconComponent,
    FormControlGeneratorComponent,
    ReactiveFormsModule,
    IonButton,
    HessaBtnDirective,
    TranslocoDirective,
  ],
  standalone: true,
})
export class PublishContentDialogComponent implements OnInit {
  private readonly transloco = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);
  private readonly contentPublishService = inject(ContentPublishService);
  private readonly toaster = inject(HesToasterService);

  readonly faWarning: FaIconComponentsProps = {
    icon: faCircleExclamation,
    size: 'sm',
  };

  // Track initial load state
  private isInitialLoad = true;

  selectedStudents = signal<number[]>([]);
  selectedClasses = signal<number[]>([]);
  @Input() isEditMode = false;
  @Input() publishedFor: 'CLASS' | 'STUDENT' | 'TOPIC' | null;
  @Input() contentType: 'Attachment' | 'video' | 'exam' | 'assignment';
  @Input() contentId: number;
  @Input() close: (success: boolean, cancelled: boolean) => void;

  contentTypeText = computed(() => {
    switch (this.contentType) {
      case 'Attachment':
        return this.transloco.translate('content_management.attachment.title');
      case 'video':
        return this.transloco.translate('content_management.video.title');
      case 'exam':
        return this.transloco.translate('content_management.exam.title');
      case 'assignment':
        return this.transloco.translate('content_management.assignment.title');
    }
  });

  faCircleExclamation = faCircleExclamation;

  inProgress = signal(false);
  classes = signal<ISelectValue[]>([]);
  students = signal<ISelectValue[]>([]);

  publishForm = this.fb.group({
    classes: this.fb.control<number[]>([], [Validators.required]),
    students: this.fb.control<number[]>([], [Validators.required]),
  });

  private readonly _selectedClasses = computed<ISelectValue[]>(() => {
    return this.selectedClasses().map((item) => ({
      value: item,
      displayedValue:
        this.classes().find((c) => c.value === item)?.displayedValue || '',
    }));
  });

  private readonly _selectedStudents = computed<ISelectValue[]>(() => {
    return this.selectedStudents().map((item) => ({
      value: item,
      displayedValue:
        this.students().find((s) => s.value === item)?.displayedValue || '',
    }));
  });

  formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.transloco.translate('course_management.class.placeholder'),
        placeholder: this.transloco.translate('global.select_class.dropdown'),
        type: 'searchable-select',
        isMultiple: true,
        formControlName: 'classes',
        required: true,
        selectValues: this.classes(),
      },
      {
        label: this.transloco.translate('student_selection.select_names_label'),
        placeholder: this.transloco.translate('global.search.placeholder'),
        type: 'searchable-checkbox-select',
        formControlName: 'students',
        required: false,
        selectValues: this.students(),
        initSelectValues: this._selectedStudents(),
      },
    ];
  });

  constructor() {}

  ngOnInit() {
    // Load data once on init
    this.getClassData(this.isInitialLoad);
    this.listenForChanges();
  }

  listenForChanges() {
    // When classes change, only refresh partial data (students, new class list, etc.)
    this.publishForm.controls.classes.valueChanges.subscribe((value) => {
      if (!this.isInitialLoad) {
        // On subsequent changes, refresh data but do NOT patch the form again
        this.refreshStudentsForClass(value);
      }
    });
  }

  /**
   * Called on the first load OR explicitly if you want to re-patch form data
   */
  getClassData(isInitialLoad: boolean) {
    const selectedClasses = this.publishForm.controls.classes.value || [];
    const classArray = Array.isArray(selectedClasses)
      ? selectedClasses
      : [selectedClasses];

    this.getSubscription(classArray).subscribe((data) => {
      // Convert server data to the shapes you need
      const classData =
        data.available.classes?.map((item) => ({
          value: item.id,
          displayedValue: item.displayName,
        })) || [];

      const students =
        data.available.students.map((student) => ({
          value: student.id,
          displayedValue: student.displayName,
        })) || [];

      this.classes.set(classData);
      this.students.set(students);

      let publishedFor: string | null = 'TOPIC';
      if (this.contentType === 'Attachment' || this.contentType === 'video') {
        publishedFor = data.selected.attachment?.publishFor ?? null;
      } else if (this.contentType === 'exam') {
        publishedFor = data.selected.exam?.publishFor ?? null;
      } else if (this.contentType === 'assignment') {
        publishedFor = data.selected.assignment?.publishFor ?? null;
      }

      // This makes sure if it was published before for a specific class, all students are auto-selected
      if (publishedFor === 'CLASS') {
        const selectedStudents = students.map((student) => student.value);
        this.selectedStudents.set(selectedStudents);
      }

      // Only patch form or set signals if this is the initial load
      if (isInitialLoad) {
        if (this.isEditMode) {
          let selectedStudents = data.selected.students?.map((s) => s.id) ?? [];
          let selectedClasses = data.selected.classes?.map((c) => c.id) ?? [];

          // If it's 'TOPIC', by your logic, you auto-select all
          if (publishedFor === 'TOPIC') {
            selectedStudents = students.map((student) => student.value);
            selectedClasses = classData.map((cls) => cls.value);
          }

          this.selectedStudents.set(selectedStudents);
          this.selectedClasses.set(selectedClasses);
          this.publishForm.patchValue(
            {
              classes: selectedClasses,
              students: selectedStudents,
            },
            { emitEvent: false },
          );

          // This is to ensure that we reload the students as per selected class
          if (publishedFor !== 'TOPIC') {
            this.getClassData(this.isInitialLoad);
          }
        } else {
          // Non-edit mode -> Default selection of everything
          this.selectedStudents.set(
            this.students().map((student) => +student.value),
          );
          this.selectedClasses.set(this.classes().map((cls) => +cls.value));

          this.publishForm.patchValue(
            {
              classes: this.selectedClasses(),
              students: this.selectedStudents(),
            },
            { emitEvent: false },
          );
        }

        // Mark as loaded so we don't re-patch next time
        this.isInitialLoad = false;
      }
    });
  }

  /**
   * Called when the user changes classes, but we don't want to re-patch the form
   */
  refreshStudentsForClass(selectedClasses: number[] | null) {
    const classArray = selectedClasses
      ? Array.isArray(selectedClasses)
        ? selectedClasses
        : [selectedClasses]
      : [];

    this.getSubscription(classArray).subscribe((data) => {
      const classData =
        data.available.classes?.map((item) => ({
          value: item.id,
          displayedValue: item.displayName,
        })) || [];

      const students =
        data.available.students.map((student) => ({
          value: student.id,
          displayedValue: student.displayName,
        })) || [];

      this.classes.set(classData);
      this.students.set(students);
    });
  }

  getSubscription(selectedClass: number[]): Observable<ContentPublish> {
    switch (this.contentType) {
      case 'Attachment':
      case 'video':
        return this.contentPublishService.getAttachmentPublishData(
          this.contentId,
          selectedClass,
        );

      case 'exam':
        return this.contentPublishService.getExamPublishData(
          this.contentId,
          selectedClass,
        );

      case 'assignment':
        return this.contentPublishService.getAssignmentPublishData(
          this.contentId,
          selectedClass,
        );
    }
  }

  cancel() {
    this.publishForm.reset();
    this.close(false, true);
  }

  submit() {
    this.inProgress.set(true);
    const publishData = this.publishForm.value;

    // Ensure students and classes are arrays
    const studentsRaw = publishData.students;
    const classesRaw = publishData.classes;
    const students = Array.isArray(studentsRaw)
      ? studentsRaw
      : studentsRaw
        ? [studentsRaw]
        : [];
    const classes = Array.isArray(classesRaw)
      ? classesRaw
      : classesRaw
        ? [classesRaw]
        : [];

    if (students.length === 0 && classes.length === 0) {
      this.inProgress.set(false);
      return;
    }

    let payload: PublishPayload;
    if (
      (students.length === 0 && classes.length > 0) ||
      students.length === this.students().length
    ) {
      payload = { classIds: classes, publish: true, publishFor: 'CLASS' };
    } else {
      payload = { publish: true, publishFor: 'STUDENT', studentIds: students };
    }

    this.submitData(payload)
      .pipe(first())
      .subscribe({
        next: () => {
          this.inProgress.set(false);
          this.close(true, false);
        },
        error: (error) => {
          this.inProgress.set(false);
          this.close(false, false);
          this.toaster.showBackendError(error);
        },
      });
  }

  submitData(payload: any) {
    switch (this.contentType) {
      case 'Attachment':
      case 'video':
        return this.contentPublishService.putAttachmentPublishData(
          this.contentId,
          payload,
        );
      case 'exam':
        return this.contentPublishService.putExamPublishData(
          this.contentId,
          payload,
        );
      case 'assignment':
        return this.contentPublishService.putAssignmentPublishData(
          this.contentId,
          payload,
        );
    }
  }
}
