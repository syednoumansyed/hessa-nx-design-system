import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  OnDestroy,
  ChangeDetectorRef,
  viewChild,
  TemplateRef,
} from '@angular/core';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { enumArrayFromEnum } from '@shared/enums';
import {
  VirtualClassroomRepeatOptions,
  VirtualClassroomServiceProviders,
} from '@pages/vcr/data-access/vcr.enum';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import {
  FormBuilder,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { combineLatest, Subscription } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { LectureApiService } from '@pages/course-management/data-access/lecture.api.service';
import { LectureDTO } from '@pages/course-management/data-access/course-management.dto';
import { VirtualClassroomPayloadDTO } from '@pages/vcr/data-access/vcr.dto';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { getDayName } from '../utils';
import { VcrAPIService } from '@pages/vcr/data-access/vcr.api-service';
import { getDayOfWeek } from '@pages/course-management/utils/day-of-week.utils';
import { AuthService } from '@auth/auth.service';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { Idropdown } from '@shared/interfaces';
import { format, parse } from 'date-fns';
import { MeetingService } from '@pages/course-management/data-access/meeting.service';
import { CommonModule } from '@angular/common';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-announcements',
  templateUrl: './virtual-classroom-form.page.html',
  standalone: true,
  providers: [
    SchoolStructureListingService,
    LectureApiService,
    VcrAPIService,
    CourseManagementService,
  ],
  imports: [
    HesButtonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonSpinner,
    TranslocoDirective,
    FormControlGeneratorComponent,
    CommonModule,
  ],
})
export class VirtualClassRoomPages implements OnInit, OnDestroy {
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly authService = inject(AuthService);
  private readonly courseService = inject(CourseManagementService);
  private readonly lectureApiService = inject(LectureApiService);
  private readonly toastr = inject(HesToasterService);
  private readonly virtualClassroomService = inject(VcrAPIService);
  private readonly translocoService = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);
  private readonly nonNullablefb = inject(NonNullableFormBuilder);
  private readonly subscription = new Subscription();
  private readonly route = inject(ActivatedRoute);
  private schoolStructureListingService: SchoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  meetingLink: string;
  customTemplate = viewChild<TemplateRef<any>>('customSelectOption');
  isLoading = signal(false);
  isMeetingLinkLoading = signal(false);
  subjectDropdown = signal<Idropdown[]>([]);
  _lectureList = signal<LectureDTO[]>([]);
  isMeetingLinkHidden = signal(false);
  meetingLinkGenerated = signal(false);
  lectures = computed(() => {
    return this._lectureList().map((lecture) => {
      const startTime = parse(lecture.startTime, 'HH:mm', new Date());
      const endTime = parse(lecture.endTime, 'HH:mm', new Date());
      const formattedStartTime = format(startTime, 'HH:mm');
      const formattedEndTime = format(endTime, 'HH:mm');
      const time = `${formattedStartTime} - ${formattedEndTime}`;
      return {
        displayedValue: `${getDayOfWeek(this.translocoService.getActiveLang(), lecture.dayOfWeek)} (${this.translocoService.translate('enum.PERIOD')} ${lecture.periodNumber ?? ''}: ${time})`,
        value: lecture.id,
      };
    });
  });

  id: string | null = null;
  isEditMode = signal(false);
  private isInitializing = false;

  virtualClassRoomForm = this.fb.group({
    subjectId: this.nonNullablefb.control<number | null>(
      null,
      Validators.required,
    ),
    classId: this.nonNullablefb.control<number | null>(
      null,
      Validators.required,
    ),
    serviceProvider:
      this.nonNullablefb.control<VirtualClassroomServiceProviders | null>(
        VirtualClassroomServiceProviders.GOOGLE_MEET,
        Validators.required,
      ),
    meetingLink: this.nonNullablefb.control('', [
      Validators.required,
      Validators.pattern(
        /^((http|https):\/\/)?[\w-]+(\.[\w-]+)+([\w\-./?%&=:@#]*)?$/i,
      ),
    ]),
    levelId: this.nonNullablefb.control<number | null>(
      null,
      Validators.required,
    ),
    lectureIds: this.nonNullablefb.control<number[]>([], Validators.required),
    repeatOption: this.nonNullablefb.control<VirtualClassroomRepeatOptions>(
      VirtualClassroomRepeatOptions.ONCE,
      Validators.required,
    ),
  });

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private meetingService: MeetingService,
    private hesTranslateService: HesTranslateService,
  ) {}

  ngOnInit() {
    this.virtualClassRoomForm.controls.serviceProvider.valueChanges.subscribe(
      (value) => {
        if (
          value === VirtualClassroomServiceProviders.MICROSOFT_TEAMS &&
          !this.isInitializing
        ) {
          const subjectId = this.virtualClassRoomForm.controls.subjectId.value;
          const subjectName =
            this.subjectDropdown().find((s) => s.value === subjectId)
              ?.displayedValue ?? '';
          this.createMeeting(subjectName);
        } else {
          this.virtualClassRoomForm.controls.meetingLink.setValue('');
          this.meetingLinkGenerated.set(false);
          this.isMeetingLinkHidden.set(false);
        }
      },
    );
    this.isLoading.set(true);
    this.subscription.add(
      this.route.paramMap.subscribe((params) => {
        this.id = params.get('id');
        this.isEditMode.set(!!this.id);

        if (this.isEditMode()) {
          this.loadVirtualClassroomForEdit();
        } else {
          this.loadSubjects();
          this.setupLectureDropdown();
        }
      }),
    );
    this.setupValueChanges();
    this.isLoading.set(false);
  }

  private setupValueChanges() {
    this.subscription.add(
      this.virtualClassRoomForm.controls.subjectId.valueChanges.subscribe(
        () => {
          if (this.isInitializing) return;
          this.virtualClassRoomForm.controls.levelId.reset(null);
          this.virtualClassRoomForm.controls.classId.reset(null);
          this.virtualClassRoomForm.controls.serviceProvider.reset(null);
          this.virtualClassRoomForm.controls.meetingLink.reset('');
          this.virtualClassRoomForm.controls.lectureIds.reset([]);
          this._lectureList.set([]);
          this.cdr.detectChanges();
        },
      ),
    );

    this.subscription.add(
      this.virtualClassRoomForm.controls.levelId.valueChanges.subscribe(() => {
        if (this.isInitializing) return;
        this.virtualClassRoomForm.controls.classId.reset(null);
        this.virtualClassRoomForm.controls.serviceProvider.reset(null);
        this.virtualClassRoomForm.controls.meetingLink.reset('');
        this.virtualClassRoomForm.controls.lectureIds.reset([]);
        this._lectureList.set([]);
        this.cdr.detectChanges();
      }),
    );

    this.subscription.add(
      this.virtualClassRoomForm.controls.classId.valueChanges.subscribe(() => {
        if (this.isInitializing) return;
        this.virtualClassRoomForm.controls.serviceProvider.reset(null);
        this.virtualClassRoomForm.controls.meetingLink.reset('');
        this.cdr.detectChanges();
      }),
    );
  }

  private loadVirtualClassroomForEdit() {
    if (!this.id) return;
    this.isInitializing = true;
    this.isLoading.set(true);

    this.subscription.add(
      this.virtualClassroomService.getVirtualClassroomById(+this.id).subscribe({
        next: (response) => {
          const classroom = response.data[0];
          if (classroom) {
            this.virtualClassRoomForm.patchValue({
              subjectId: classroom.subjectId,
              classId: classroom.classId,
              serviceProvider: classroom.serviceProvider,
              meetingLink: classroom.meetingLink,
              levelId: classroom.level.id,
              lectureIds: classroom.lectures.map((lecture) => lecture.id),
              repeatOption: classroom.repeatOption,
            });
            this.loadSubjects();
            this.schoolStructureListingService.updateSelectedLevel(
              classroom.level.id,
            );
            this.schoolStructureListingService.updateSelectedClass(
              classroom.classId,
            );
            this.getLectures();
            this.isInitializing = false;
            this.isLoading.set(false);
            this.meetingLinkGenerated.set(true);
            if (
              classroom.serviceProvider ===
              VirtualClassroomServiceProviders.MICROSOFT_TEAMS
            ) {
              this.isMeetingLinkHidden.set(true);
            }
          }
        },
        error: () => {
          this.isInitializing = false;
          this.isLoading.set(false);
          this.toastr.error('Failed to load classroom data for editing.');
        },
      }),
    );
  }

  private loadSubjects() {
    const personnelId = this.authService.user()?.userTypeId;
    if (!personnelId) {
      this.toastr.error('Unable to identify current user.');
      return;
    }

    this.subscription.add(
      this.courseService.getSubjectsByPersonnelId(personnelId).subscribe({
        next: (data) => {
          this.subjectDropdown.set(data);
        },
        error: () => {
          this.isLoading.set(false);
          this.toastr.error('Failed to load subjects.');
        },
      }),
    );
  }

  private setupLectureDropdown() {
    this.subscription.add(
      combineLatest([
        this.virtualClassRoomForm.controls.subjectId.valueChanges,
        this.virtualClassRoomForm.controls.classId.valueChanges,
        this.virtualClassRoomForm.controls.levelId.valueChanges,
      ])
        .pipe(
          tap(() => this._lectureList.set([])),
          filter(([subjectId, classId]) => !!subjectId && !!classId),
          switchMap(([subjectId, classId]) => {
            this.isLoading.set(true);
            return this.lectureApiService.fetchLectureBySubjectIdClassId(
              subjectId!,
              classId!,
              this.academicYearScope.selectedAcademicYear()?.id!,
            );
          }),
        )
        .subscribe({
          next: (data) => {
            this._lectureList.set(Array.isArray(data) ? data : [data]);
            this.isLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading.set(false);
          },
        }),
    );
  }

  onClassIdChange = () => {
    this.virtualClassRoomForm.controls.lectureIds.reset();
    this.getLectures();
  };

  private getLectures() {
    const subjectId = this.virtualClassRoomForm.controls.subjectId.value;
    const classId = this.virtualClassRoomForm.controls.classId.value;
    const levelId = this.virtualClassRoomForm.controls.levelId.value;
    const academicYearId = this.academicYearScope.selectedAcademicYear()?.id;

    if (subjectId && classId && levelId && academicYearId) {
      this.isLoading.set(true);
      this._lectureList.set([]);
      this.cdr.detectChanges();

      this.subscription.add(
        this.lectureApiService
          .fetchLectureBySubjectIdClassId(subjectId, classId, academicYearId)
          .subscribe({
            next: (lectures) => {
              this._lectureList.set(
                Array.isArray(lectures) ? lectures : [lectures],
              );
              this.isLoading.set(false);
              this.cdr.detectChanges();
            },
            error: () => {
              this.isLoading.set(false);
              this.cdr.detectChanges();
            },
          }),
      );
    }
  }

  virtualClassRoomDetailsFormConfig = computed<IControl[]>(() => {
    const isNativePlatform = Capacitor.getPlatform() !== 'web';
    const config: IControl[] = [
      {
        label: this.translocoService.translate('global.subject.title'),
        placeholder: this.translocoService.translate(
          'global.subject.placeholder',
        ),
        type: 'searchable-select',
        formControlName: 'subjectId',
        required: true,
        selectValues: this.subjectDropdown(),
      },
      {
        label: this.translocoService.translate('global.level.label'),
        placeholder: this.translocoService.translate(
          'global.level.placeholder',
        ),
        formControlName: 'levelId',
        type: 'searchable-select',
        required: true,
        SchoolStructureListingType: 'level',
      },
      {
        label: this.translocoService.translate('global.class.label'),
        placeholder: this.translocoService.translate(
          'global.class.placeholder',
        ),
        type: 'searchable-select',
        formControlName: 'classId',
        required: true,
        SchoolStructureListingType: 'class',
        onValueChange: this.onClassIdChange,
      },
      {
        label: this.translocoService.translate(
          'virtual_classrooms.service_provider.title',
        ),
        placeholder: this.translocoService.translate(
          'virtual_classrooms.service_provider.placeholder',
        ),
        type: 'searchable-select',
        formControlName: 'serviceProvider',
        selectValues: enumArrayFromEnum(VirtualClassroomServiceProviders).map(
          (serviceProvider) => ({
            displayedValue: this.hesTranslateService.enumT(
              serviceProvider as string,
            ),
            value: serviceProvider as VirtualClassroomServiceProviders,
          }),
        ) as ISelectValue<VirtualClassroomServiceProviders>[],
        required: true,
        helperText: this.meetingLinkGenerated()
          ? this.translocoService.translate(
              'virtual_classrooms.microsoft_teams.meeting.created',
            )
          : '',
        helperTextColor: '#069952',
      },
    ];

    if (!this.isMeetingLinkHidden()) {
      config.push({
        label: this.translocoService.translate(
          'virtual_classrooms.meeting_link.title',
        ),
        placeholder: this.translocoService.translate(
          'virtual_classrooms.meeting_link.placeholder',
        ),
        type: 'input',
        formControlName: 'meetingLink',
        required: true,
      });
    }

    return config;
  });

  linkLectureFormConfig = computed<IControl[]>(() => [
    {
      label: this.translocoService.translate(
        'virtual_classrooms.lecture.title',
      ),
      placeholder: this.translocoService.translate(
        'virtual_classrooms.select_lecture.dropdown',
      ),
      type: 'searchable-select',
      formControlName: 'lectureIds',
      required: true,
      isMultiple: true,
      searchableSelectObject: {
        showClearBtn: false,
        selectOptionTemplate: this.customTemplate(),
      },
      selectValues: this.lectures(),
    },
    {
      label: this.translocoService.translate('virtual_classrooms.repeat.title'),
      type: 'radio',
      formControlName: 'repeatOption',
      selectValues: enumArrayFromEnum(VirtualClassroomRepeatOptions).map(
        (e) => ({
          displayedValue: this.hesTranslateService.enumT(e as string),
          value: e,
        }),
      ) as ISelectValue[],
      required: true,
    },
  ]);

  onSave() {
    const formValues = this.virtualClassRoomForm.getRawValue();
    const payload: VirtualClassroomPayloadDTO = {
      subjectId: formValues.subjectId!,
      levelId: formValues.levelId!,
      academicYearId: this.academicYearScope.selectedAcademicYear()?.id!,
      classId: formValues.classId!,
      serviceProvider: formValues.serviceProvider!,
      meetingLink: formValues.meetingLink!,
      repeatOption: formValues.repeatOption!,
      lectureIds: formValues.lectureIds!,
    };

    const request$ = this.isEditMode()
      ? this.virtualClassroomService.updateVirtualClassroom(+this.id!, payload)
      : this.virtualClassroomService.addVirtualClassroom(payload);

    request$.subscribe({
      next: (response) => {
        this.virtualClassRoomForm.reset();
        this._lectureList.set([]);
        this.cdr.detectChanges();
        this.toastr.success(
          response.message ||
            (this.isEditMode()
              ? 'Classroom updated successfully'
              : 'Classroom added successfully'),
        );
        this.goBackToParent();
      },
      error: (error) => {
        this.toastr.showBackendError(error);
      },
    });
  }

  getDayInfo(id: number): { day: string; text: string } {
    const lecture = this._lectureList().find((lecture) => lecture.id === id);
    if (!lecture)
      return {
        day: '',
        text: '',
      };
    const dayOfWeek = lecture?.dayOfWeek;
    const startTime = parse(lecture.startTime, 'HH:mm', new Date());
    const endTime = parse(lecture.endTime, 'HH:mm', new Date());
    const formattedStartTime = format(startTime, 'HH:mm');
    const formattedEndTime = format(endTime, 'HH:mm');
    const time = `${formattedStartTime} - ${formattedEndTime}`;
    return {
      day: getDayOfWeek(this.translocoService.getActiveLang(), dayOfWeek) ?? '',
      text: `(${this.translocoService.translate('enum.PERIOD')} ${lecture.periodNumber ?? ''}: ${time})`,
    };
  }

  goBackToParent() {
    this.router.navigate(['/vcr'], { relativeTo: this.route });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    const subscription =
      this.virtualClassRoomForm.controls.serviceProvider.valueChanges.subscribe();
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  onCancelClick() {
    this._lectureList.set([]);
    this.cdr.detectChanges();
    this.virtualClassRoomForm.reset();
    this.goBackToParent();
  }
  async createMeeting(subject: string) {
    try {
      this.isLoading.set(true);
      const meetingLink = await this.meetingService.createMeeting(subject);
      if (meetingLink) {
        this.meetingLink = meetingLink;
        this.virtualClassRoomForm.controls.meetingLink.setValue(
          this.meetingLink,
        );
        this.isMeetingLinkHidden.set(true);
        this.meetingLinkGenerated.set(true);
      }
    } catch (error) {
      this.isMeetingLinkHidden.set(false);
      console.error('Error creating meeting:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected readonly getDayName = getDayName;
}
