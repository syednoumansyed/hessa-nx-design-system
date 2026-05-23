import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { JournalService } from '@pages/journal/journal.service';
import { format } from 'date-fns';
import {
  FieldSection,
  SectionControl,
} from '@pages/journal/data-access/journal-field.dto';
import { first } from 'rxjs';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import {
  JournalStatus,
  JournalType,
} from '@pages/journal/data-access/journal.enum';
import { DayOfWeekPipe } from '@pages/course-management/pipes/day-of-week.pipe';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { isMobile } from '@utils/platform';
import { Journal } from '@pages/journal/data-access/journal.interface';

@Component({
  selector: 'app-add-journal',
  templateUrl: './add-journal.page.html',
  styleUrls: ['./add-journal.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    FormControlGeneratorComponent,
    HessaBtnDirective,
    IonButton,
    ReactiveFormsModule,
    TranslocoDirective,
    DayOfWeekPipe,
    RbacDirective,
  ],
})
export class AddJournalPage implements OnInit {
  // Injected services
  private readonly transLoco = inject(TranslocoService);
  private readonly route = inject(ActivatedRoute);
  private router = inject(Router);
  private readonly toastService = inject(HesToasterService);
  private auth = inject(AuthService);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private journalService = inject(JournalService);
  private fb = inject(FormBuilder);
  protected readonly rbac = inject(RoleBaseAccessControlService);

  // Constants
  protected readonly JournalStatus = JournalStatus;
  protected readonly JournalType = JournalType;

  // Signals and inputs
  controls = signal<IControl[]>([]);
  journalId = input<string>();
  studentId = input<string>();
  journal = signal<Journal | null>(null);
  inProgress = signal(false);
  noOfChild = signal(isMobile() ? 1 : 4);

  isMobile = isMobile();

  // Computed properties
  userType = computed(() => this.auth.user()?.type);
  editMode = computed(
    () => !this.journalId() || this.router.url.includes('edit'),
  );
  date = signal(new Date());
  today = computed(() => this.journal()?.journalDate ?? this.date());
  endDate = computed(() => this.journal()?.journalEndDate ?? this.date());
  // get day of week in number
  day = computed(() => +format(this.today(), 'i') % 7);
  endDay = computed(() => +format(this.endDate(), 'i') % 7);
  journalType = computed(() => {
    const journalType = this.journal()
      ? this.journal()?.type
      : this.router.url.includes('daily')
        ? 'DAILY'
        : 'WEEKLY';
    return journalType;
  });
  semester = computed(() => {
    if (this.journalId()) {
      return {
        id: this.journal()?.semesterId,
        name: this.journal()?.semesterName,
      };
    } else {
      return {
        id: this.academicYearScopeService.selectedSemester()?.id,
        name: this.academicYearScopeService.selectedSemester()?.name,
      };
    }
  });

  // Holds the response data
  sections: WritableSignal<FieldSection[]> = signal([]);
  groupedControls = signal<SectionControl[]>([]);

  // Main form
  form: FormGroup;

  constructor() {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['date']) {
        const date = new Date(0);
        date.setUTCSeconds(+params['date']);
        this.date.set(date);
      }
    });
    this.getJournalFields();
  }

  /**
   * Fetch the sections/items from API, then build the form and
   * generate the config for rendering.
   */
  getJournalFields() {
    this.journalService
      .getJournalFields()
      .pipe(first())
      .subscribe((response) => {
        let sections = response.data.sections;
        if (!this.journalId())
          sections = sections.filter(
            (item) => item.title !== 'api.journal.title.guardians_note',
          );
        this.sections.set(sections);
        if (this.journalId()) {
          this.getJournal();
        } else {
          this.getInitialInfo();
        }
      });
  }

  /**
   * Fetch the journal data by ID.
   */
  getJournal() {
    this.journalService
      .getJournal(this.journalId()!)
      .pipe(first())
      .subscribe((response) => {
        this.journal.set(response);
        this.buildForm();
        this.generateFormConfigFromApiData();
        // Once we have the journal data, patch form in edit mode
        if (this.journal()?.status !== JournalStatus.NEW) {
          this.patchFormWithJournalData(response);
        }
      });
  }

  getInitialInfo() {
    this.journalService
      .getPersonnelJournals(
        this.journalType()!,
        this.studentId()!,
        this.today()
          ? Math.floor(new Date(this.today()).getTime() / 1000.0)
          : Math.floor(new Date().getTime() / 1000.0),
      )
      .pipe(first())
      .subscribe((response) => {
        const journal = response.filter(
          (f) => f.studentId.toString() === this.studentId(),
        )[0];
        // set status as new because we want to create a new journal
        journal.status = JournalStatus.NEW;
        this.journal.set(journal);
        this.buildForm();
        this.generateFormConfigFromApiData();
      });
  }

  /**
   * Build a FormGroup based on the sections/items data.
   * Use `item.key` for the control name.
   */
  buildForm() {
    const group: { [key: string]: any } = {};

    this.sections().forEach((section) => {
      if (!section.items) return;

      section.items.forEach((item) => {
        const controlName = item.key; // Use "key" from JSON

        if (item.type === 'TEXT_AREA') {
          group[controlName] = new FormControl('');
        } else if (item.type === 'CHECKBOX') {
          group[controlName] = new FormControl<string>('', {
            nonNullable: true,
          });
        } else if (item.type === 'RADIO') {
          group[controlName] = new FormControl<string[]>([], {
            nonNullable: true,
          });
        } else {
          group[controlName] = new FormControl('');
        }
      });
    });

    this.form = this.fb.group(group);
  }

  /**
   * Generate the form config for rendering. This is used by the FormControlGeneratorComponent.
   * @private
   */
  private generateFormConfigFromApiData() {
    const groups: SectionControl[] = [];

    this.sections().forEach((section) => {
      // Create a new group for each section using section.key and title.
      const sectionControl: SectionControl = {
        sectionTitle: this.transLoco.translate(section.title),
        sectionKey: section.key,
        hideTitle: section.hideTitle ?? false,
        controls: [],
      };

      section.items?.forEach((item) => {
        let mappedType: IControl['type'] = 'input'; // fallback

        switch (item.type) {
          case 'TEXT_AREA':
            mappedType = 'textarea';
            break;
          case 'CHECKBOX':
            mappedType = 'checkbox';
            break;
          case 'RADIO':
            mappedType = 'radio';
            break;
          default:
            mappedType = 'input';
        }

        const canEdit =
          (this.userType() === UserType.GUARDIAN &&
            section.key === 'guardiansNote') ||
          (this.userType() === UserType.PERSONNEL &&
            section.key !== 'guardiansNote' &&
            this.editMode());

        let helperText = undefined;
        const teacherNamesKey = [
          'arabicTeacherNote',
          'scienceTeacherNote',
          'englishTeacherNote',
          'healthAndCareTeacherNote',
          'islamicTeacherNote',
        ];

        if (mappedType === 'textarea' && teacherNamesKey.includes(item.key)) {
          if (item.key === 'arabicTeacherNote') {
            helperText = this.journal()?.arabicTeacherDisplayName ?? '';
          } else if (item.key === 'scienceTeacherNote') {
            helperText = this.journal()?.scienceTeacherDisplayName ?? '';
          } else if (item.key === 'englishTeacherNote') {
            helperText = this.journal()?.englishTeacherDisplayName ?? '';
          } else if (item.key === 'healthAndCareTeacherNote') {
            helperText = this.journal()?.healthAndCareTeacherDisplayName ?? '';
          } else if (item.key === 'islamicTeacherNote') {
            helperText = this.journal()?.islamicTeacherDisplayName ?? '';
          }
        }
        let placeholder = this.transLoco.translate(
          'global.enter_text_here.txt',
        );

        if (!canEdit) {
          placeholder = '';
        }
        const control: IControl = {
          label: this.transLoco.translate(item.title),
          placeholder,
          type: mappedType,
          noOfChild: this.noOfChild,
          helperText,
          readonly: !canEdit,
          formControlName: item.key, // using the new key for binding
          required: item.required || false,
          viewState: !canEdit,
        };

        // If it's a CHECKBOX, set selectValues using subItem.key
        if ((item.type === 'CHECKBOX' || item.type === 'RADIO') && item.items) {
          control.selectValues = item.items.map((subItem) => {
            return {
              value: subItem.key,
              displayedValue: this.transLoco.translate(subItem.title),
            };
          });
        }
        sectionControl.controls.push(control);
      });
      groups.push(sectionControl);
    });

    this.groupedControls.set(groups);
  }

  /**
   * Patch the form with existing journal data
   */
  private patchFormWithJournalData(journalData: any) {
    if (!journalData) return;

    // Build an object to patch
    const patchData: any = {};

    // Loop through sections/items to find matching form keys
    this.sections().forEach((section) => {
      section.items?.forEach((item) => {
        const key = item.key; // e.g. "taskDone", "meal", etc.
        if (journalData[key] !== undefined && this.form.get(key)) {
          if (item.type === 'RADIO') {
            const value = journalData[key];
            patchData[key] =
              Array.isArray(value) && value.length ? journalData[key][0] : '';
          } else {
            patchData[key] = journalData[key];
          }
        }
      });
    });

    // Patch the form
    this.form.patchValue(patchData);
    if (!this.editMode()) {
      this.form.disable();
      if (
        this.userType() === UserType.GUARDIAN &&
        this.rbac.hasPermission(
          RESOURCE_PERMISSION.JOURNAL.UPDATE.ACKNOWLEDGE_JOURNAL,
        ) &&
        this.journal()?.status === JournalStatus.PUBLISHED
      ) {
        this.form.get('acknowledgementComment')?.enable();
      }
    }
  }

  /**
   * Create the final payload object. If you want the final JSON to have the 'key'
   * as the property name, use item.key in the payload.
   */
  createPayload() {
    const rawFormValue = this.form.value;
    const semester = this.semester();
    if (!semester) {
      return;
    }
    const payload: any = {
      studentId: this.studentId() ?? this.journal()?.studentId,
      semesterId: semester?.id,
      type: this.journalType(),
      date: this.today()
        ? Math.floor(new Date(this.today()).getTime() / 1000.0)
        : null,
    };

    // Loop through each section/item from the data
    this.sections().forEach((section) => {
      section.items?.forEach((item) => {
        const key = item.key; // Use item.key (e.g., "meal", "lunch", etc.)
        // Check if the field is a RADIO type
        if (item.type === 'RADIO') {
          // Wrap the value in an array if it's not already one
          payload[key] = rawFormValue[key] ? [rawFormValue[key]] : [];
        } else {
          payload[key] = rawFormValue[key];
        }
      });

      // If the user lacks permission, remove guardiansNote
      if (
        !this.rbac.hasPermission(
          RESOURCE_PERMISSION.JOURNAL.UPDATE.ACKNOWLEDGE_JOURNAL,
        ) ||
        this.userType() !== UserType.GUARDIAN
      ) {
        delete payload['guardiansNote'];
        delete payload['acknowledgementComment'];
      }
    });

    return this.removeEmptyValues(payload);
  }

  private removeEmptyValues(value: any): any {
    // 1) If it's an array, clean each item and filter out empties
    if (Array.isArray(value)) {
      return value
        .map((item) => this.removeEmptyValues(item)) // recursively clean each item
        .filter((item) => {
          // Filter out empty string or null
          if (item === '' || item === null) {
            return false;
          }
          // If it’s an *object or array* with no keys/items left, remove it
          return !(typeof item === 'object' && Object.keys(item).length === 0);
        });
    }

    // 2) If it's an object, recursively clean each property
    if (value !== null && typeof value === 'object') {
      const newObj: any = {};
      for (const [key, val] of Object.entries(value)) {
        const cleanedVal = this.removeEmptyValues(val);
        // Keep the property only if it’s not empty
        if (
          cleanedVal !== '' &&
          cleanedVal !== null &&
          !(
            typeof cleanedVal === 'object' &&
            Object.keys(cleanedVal).length === 0
          )
        ) {
          newObj[key] = cleanedVal;
        }
      }
      return newObj;
    }

    // 3) If it's just a primitive (string/number/etc.) return as is
    return value;
  }
  /**
   * Submission logic: create the payload and handle it
   */
  onSubmit() {
    const finalPayload = this.createPayload();
    this.inProgress.set(true);
    if (this.journalId() || this.journal()?.status !== JournalStatus.NEW) {
      delete finalPayload.date;
      this.journalService
        .updateJournal(this.journalId()!, finalPayload)
        .pipe(first())
        .subscribe({
          next: () => {
            this.inProgress.set(false);
            this.toastService.success(
              this.transLoco.translate(
                'journals.journal_saved_successfully.txt',
              ),
            );
            this.router.navigate([`/journal/view/${this.journalId()}`]);
          },
          error: () => {
            this.inProgress.set(false);
            this.toastService.error(
              this.transLoco.translate('journals.saving_error_msg.txt'),
              this.transLoco.translate('global.wrong_msg.title'),
            );
          },
        });
    } else {
      this.journalService
        .createJournal(finalPayload)
        .pipe(first())
        .subscribe({
          next: (data) => {
            this.inProgress.set(false);
            this.toastService.success(
              this.transLoco.translate(
                'journals.journal_saved_successfully.txt',
              ),
            );
            this.router.navigate([`/journal/view/${data.data.id}`]);
          },
          error: (err) => {
            this.inProgress.set(false);
            this.toastService.error(
              this.transLoco.translate('journals.saving_error_msg.txt'),
              this.transLoco.translate('global.wrong_msg.title'),
            );
          },
        });
    }
  }

  onCancel() {
    if (this.editMode()) {
      this.form.reset();
    }
    this.router.navigate(['/journal']);
  }

  protected readonly UserType = UserType;
  journalPublishPermission = RESOURCE_PERMISSION.JOURNAL.UPDATE.PUBLISH_JOURNAL;
  journalUpdatePermission = RESOURCE_PERMISSION.JOURNAL.UPDATE.UPDATE_JOURNAL;
  journalAcknowledgePermission =
    RESOURCE_PERMISSION.JOURNAL.UPDATE.ACKNOWLEDGE_JOURNAL;

  onAcknowledge() {
    this.inProgress.set(true);
    const payload = this.createPayload();
    this.journalService
      .acknowledgeJournal(this.journalId()!, payload['acknowledgementComment'])
      .subscribe({
        next: () => {
          this.inProgress.set(false);
          this.toastService.success(
            this.transLoco.translate('journals.journal_saved_successfully.txt'),
          );
          this.getJournal();
        },
        error: () => {
          this.inProgress.set(false);
          this.toastService.error(
            this.transLoco.translate('journals.saving_error_msg.txt'),
            this.transLoco.translate('global.wrong_msg.title'),
          );
        },
      });
  }

  onPublish() {
    this.inProgress.set(true);
    this.journalService.publishJournal(this.journalId()!).subscribe({
      next: () => {
        this.inProgress.set(false);
        this.toastService.success(
          this.transLoco.translate('journals.journal_saved_successfully.txt'),
        );
        this.router.navigate([`/journal`]);
      },
      error: () => {
        this.inProgress.set(false);
        this.toastService.error(
          this.transLoco.translate('journals.saving_error_msg.txt'),
          this.transLoco.translate('global.wrong_msg.title'),
        );
      },
    });
  }
}
