import { Component, Input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { faUser } from '@fortawesome/pro-duotone-svg-icons';
import {
  ProfileHeaderComponent,
  profileMetadata,
} from '@shared/components/profile-header/profile-header.component';
import {
  IProfileDetails,
  ProfileDetailsComponent,
} from '@shared/components/profile-details/profile-details.component';
import { StudentsService } from '../students.service';
import { Router } from '@angular/router';
import {
  TranslocoDirective,
  TranslocoModule,
  TranslocoService,
} from '@jsverse/transloco';
import {
  IlinkedGuardian,
  LinkedProfilesComponent,
} from '@shared/components/linked-profiles/linked-profiles.component';
import { ProfileLoginMethodsComponent } from '@shared/components/profile-login-methods/profile-login-methods.component';
import { HesAlertComponent } from '@ui-kit/hes-alert/hes-alert.component';
import { HesAuthDirective } from '@auth/hes-auth.directive';
import { FeedbackService } from '@shared/services/feedback.service';
import { ConnectedProfileComponent } from '@shared/components/connected-profile/connected-profile.component';
import { UserType } from '@shared/enums';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { AuthService } from '@auth/auth.service';
import { ObjId } from '@shared/interfaces/common.interface';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { AccountBlockingService } from '../account-blocking.service';
import { Student } from '@shared/dto-transformation';

@Component({
  selector: 'app-student-profile',
  templateUrl: './student-profile.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    ProfileHeaderComponent,
    ProfileDetailsComponent,
    LinkedProfilesComponent,
    ProfileLoginMethodsComponent,
    HesAlertComponent,
    HesAuthDirective,
    TranslocoModule,
    ConnectedProfileComponent,
    TranslocoDirective,
  ],
  providers: [HesDatePipe],
})
export class StudentProfilePage {
  /**
   * The ID of the student.
   * @type {string | null}
   */
  @Input() id: string | null = null;

  userType: UserType = UserType.STUDENT;
  authService = inject(AuthService);
  private readonly accountBlockingService = inject(AccountBlockingService);
  private readonly hesDatePipe = inject(HesDatePipe);
  student = signal<Student | undefined>(undefined);
  metadata = signal<profileMetadata[]>([]);
  profileDetails = signal<IProfileDetails[]>([]);
  linkedGuardians = signal<IlinkedGuardian[]>([]);
  private readonly toastr = inject(HesToasterService);
  readonly updateStudentPermissionId =
    RESOURCE_PERMISSION.student.editStudentProfile;
  readonly unLinkGuardianPermissionId =
    RESOURCE_PERMISSION.student.unLinkGuardian;
  readonly changePhoneNumberPermissionId =
    RESOURCE_PERMISSION.student.changePhoneNumber;
  readonly updatePasswordPermissionId =
    RESOURCE_PERMISSION.student.updatePassword;
  readonly activateDeactiveProfilePermissionId =
    RESOURCE_PERMISSION.student.deactivateActivateProfile;
  readonly viewGuardianProfilePermissionId =
    RESOURCE_PERMISSION.guardians.viewGuardianProfile;
  constructor(
    private studentService: StudentsService,
    private router: Router,
    private translocoService: TranslocoService,
    private feedbackService: FeedbackService,
  ) {}

  ionViewWillEnter() {
    if (this.id) {
      this.getStudent(this.id);
    }
  }

  /**
   * Retrieves a student by their ID.
   * @param studentId The ID of the student to retrieve.
   */
  getStudent(studentId: string) {
    this.studentService
      .getStudent(studentId)
      .pipe()
      .subscribe((student) => {
        this.student.set(student);
        this.mapProfileDetails(student);
        this.mapProfileOverview(student);
        this.mapLinkedGuardians(student);
      });
  }

  activateStudent() {
    this.studentService.activateStudent(this.id!).subscribe({
      next: () => {
        this.onActivateStudentSuccess();
      },
      error: () => {
        this.onActivateStudentError();
      },
    });
  }

  pauseStudent(id: string, studentName: string) {
    this.accountBlockingService
      .openPauseOrDeactivateDialog(id, studentName, true)
      .subscribe({
        next: () => {
          this.getStudent(id);
        },
      });
  }

  deactivateStudent(id: string, studentName: string) {
    this.accountBlockingService
      .openPauseOrDeactivateDialog(id, studentName)
      .subscribe({
        next: () => {
          this.getStudent(id);
        },
      });
  }

  /**
   * Maps the profile details of a student to the profileDetails array.
   *
   * @param student - The student object containing the profile details.
   */
  mapProfileDetails(student: Student) {
    this.profileDetails.set([
      {
        title: this.translocoService.translate('global.full_name.title'),
        value: student.displayName,
        required: true,
      },
      {
        title: this.translocoService.translate('global.phone_number.title'),
        value: student.displayPhoneNumber ?? '-',
        type: 'phoneNumber',
      },
      {
        title: this.translocoService.translate('global.national_id.title'),
        value: student.nationalId,
      },
      {
        title: this.translocoService.translate('global.student_id.title'),
        value: student.id.toString(),
      },
      {
        title: this.translocoService.translate(
          'global.pioneer_student_id.label',
        ),
        value: student.pioneerId,
      },
      {
        title: this.translocoService.translate('global.gender.title'),
        value: student.gender,
        isEnum: true,
      },
      {
        title: this.translocoService.translate('global.nationality.title'),
        value: student.nationalityName ?? '',
      },
      {
        title: this.translocoService.translate(
          'global.passport_number_expiry_date.title',
        ),
        value: student.passportNumber,
        secondaryValue: student.passportExpiryDate,
        isSecondaryValueDate: true,
      },
      {
        title: this.translocoService.translate('global.date_of_birth.title'),
        value: student.dateOfBirth,
      },
      {
        title: this.translocoService.translate(
          'global.registration_date.title',
        ),
        value: student.registrationDate,
      },
    ]);
  }

  /**
   * Maps the profile overview for a student.
   *
   * @param student - The student object.
   */
  mapProfileOverview(student: Student) {
    this.metadata.set(
      [
        {
          hesIcon: {
            src: 'assets/icons/school.svg',
            class: 'text-base',
          },
          title: student.school?.displayName ?? '',
        },
        {
          faIcon: {
            icon: faUser,
            primaryOpacity: 0.3,
            secondaryOpacity: 1.0,
            primaryColor: '#ECAD01',
            secondaryColor: '#ECAD01',
          },
          title: student.type
            ? student.type
            : this.translocoService.translate('global.student.txt'),
        },
        {
          hesIcon: {
            src: 'assets/icons/level.svg',
            class: 'text-base',
          },
          title: student.level?.displayName ?? '',
        },
        {
          hesIcon: {
            src: 'assets/icons/class.svg',
            class: 'text-base',
          },
          title: student.class?.displayName ?? '',
        },
      ].filter((item) => !!item.title),
    );
  }

  /**
   * Maps the guardians of a student to an array of linked guardians.
   *
   * @param student - The student object containing the guardians.
   */
  mapLinkedGuardians(student: Student) {
    const linkedGuardians: IlinkedGuardian[] = [];
    student.guardians?.forEach((guardian) => {
      linkedGuardians.push({
        fullName: guardian.displayName,
        nationalId: guardian.nationalId,
        id: guardian.id.toString(),
        mobileNumber: guardian.displayPhoneNumber,
        relationship: guardian.guardianRelationship,
        profileColor: guardian.profileColor,
        imageUrl: guardian.imageUrl,
        onUnlinkProfile: () => this.onUnlinkGuardian(guardian.id.toString()),
        onViewProfile: () => this.viewGuardianProfile(guardian.id.toString()),
      });
    });
    this.linkedGuardians.set(linkedGuardians);
  }

  /**
   * Navigates to the update student page.
   */
  goToUpdateStudentPage = () => {
    this.router.navigate(['user-management/students', this.id, 'update'], {
      state: { origin: 'profile' },
    });
  };

  /**
   * Unlinks a guardian from the student.
   *
   * @param guardianId - The ID of the guardian to unlink.
   */
  unlinkGuardian = (guardianId: string) => {
    if (this.id) {
      this.studentService.unlinkGuardian(this.id, guardianId).subscribe({
        next: () => {
          this.toastr.success(
            '',
            this.translocoService.translate(
              'user_management.guardian.unlink.success.title',
            ),
          );
          this.getStudent(this.id!);
        },
        error: (error) => {
          this.toastr.showBackendError(error);
          this.unlinkGuardian(guardianId);
        },
      });
    }
  };

  /**
   * Navigates to the guardian profile page.
   *
   * @param guardianId - The ID of the guardian.
   */
  viewGuardianProfile(guardianId: string) {
    this.router.navigate(['user-management/guardians', guardianId]);
  }

  /* feedback modal methods */
  async onUnlinkGuardian(guardianId: string) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'user_management.unlink_guardian.title',
        ),
        modalMessage: this.translocoService.translate(
          'user_management.unlink_guardian.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'user_management.yes_unlink.btn',
        ),
        secondaryBtnStr: this.translocoService.translate(
          'global.no_cancel.btn',
        ),
      },
      () => this.unlinkGuardian(guardianId),
    );
  }
  onDeactivateStudent = () => {
    const { id, student } = this;
    if (id && student()) this.deactivateStudent(id, student()!.displayName);
  };

  onDeactivateStudentSuccess() {
    this.studentService.onDeactivateStudentSuccess();
    this.getStudent(this.id!);
  }
  onActivateStudent() {
    this.studentService.onActivateStudent(() => this.activateStudent());
  }
  onActivateStudentSuccess() {
    this.studentService.onActivateStudentSuccess();
    this.getStudent(this.id!);
  }
  onActivateStudentError() {
    this.studentService.onActivateStudentError(
      () => () => this.activateStudent(),
    );
  }

  onPauseStudent = () => {
    const { id, student } = this;
    if (id && student()) {
      this.pauseStudent(id, student()!.displayName);
    }
  };

  onPauseStudentSuccess() {
    this.studentService.onPauseStudentSuccess();
    this.getStudent(this.id!);
  }

  onResumeStudent() {
    const endTime = this.student()?.statusData?.endTime;
    this.studentService.onResumeStudent(
      this.hesDatePipe.transform(endTime),
      () => this.activateStudent(),
    );
  }

  onRefreshProfile = () => {
    this.getStudent(this.id!);
  };

  readonly isGuardian = this.authService.isUserGuardian;

  deactivatedMessage = computed(() => {
    const { createdBy, createdAt, reason } = this.student()?.statusData || {};
    if (this.isGuardian()) {
      return this.translocoService.translate(
        'account_status.deactivated.description',
        { reason: reason },
      );
    }
    return this.translocoService.translate(
      'deactivation_deactivated_user.account_deactivated_message.txt',
      {
        by_whom: createdBy?.displayName,
        start_time: this.hesDatePipe.transform(createdAt),
        reason: reason,
      },
    );
  });

  pausedMessage = computed(() => {
    const { createdBy, startTime, reason, endTime } =
      this.student()?.statusData || {};
    if (this.isGuardian()) {
      return this.translocoService.translate(
        'account_status.suspended.description',
        { reason: reason },
      );
    }
    return this.translocoService.translate(
      'deactivation_paused_user.account_paused_message.txt',
      {
        by_whom: createdBy?.displayName,
        start_time: this.hesDatePipe.transform(startTime),
        reason: reason,
        end_time: this.hesDatePipe.transform(endTime),
      },
    );
  });

  protected readonly UserType = UserType;
}
