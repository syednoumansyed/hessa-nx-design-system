import { Component, inject, Input, signal } from '@angular/core';
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
import { GuardianService } from '../guardians.service';
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
import { StudentsService } from '@pages/user-management/students/students.service';
import { ConnectedProfileComponent } from '@shared/components/connected-profile/connected-profile.component';
import { UserProfileColors, UserType } from '@shared/enums';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { AuthService } from '@auth/auth.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { Guardian } from '@shared/dto-transformation';

@Component({
  selector: 'app-guardian-profile',
  templateUrl: './guardian-profile.page.html',
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
})
export class GuardianProfilePage {
  /**
   * The ID of the guardian.
   * @type {string | null}
   */
  @Input() id: string | null = null;
  userType: UserType = UserType.GUARDIAN;
  auth = inject(AuthService);
  rbacService = inject(RoleBaseAccessControlService);
  guardian = signal<Guardian | undefined>(undefined);
  metadata = signal<profileMetadata[]>([]);
  profileDetails = signal<IProfileDetails[]>([]);
  linkedStudents = signal<IlinkedGuardian[]>([]);
  private readonly toastr = inject(HesToasterService);
  readonly updateGuardianPermissionId =
    RESOURCE_PERMISSION.guardians.updateGuardainsProfile;
  readonly unlinkStudentPermissionId =
    RESOURCE_PERMISSION.guardians.unLinkStudent;
  readonly changePhoneNumberPermissionId =
    RESOURCE_PERMISSION.guardians.changePhoneNumber;
  readonly activateDeactiveProfilePermissionId =
    RESOURCE_PERMISSION.guardians.deactivateActivateProfile;
  isActivateProfilePermission = this.rbacService.hasPermission(
    this.activateDeactiveProfilePermissionId,
  );
  userProfileColors = UserProfileColors;
  constructor(
    private guardianService: GuardianService,
    private studentService: StudentsService,
    private router: Router,
    private translocoService: TranslocoService,
    private feedbackService: FeedbackService,
  ) {}

  ionViewWillEnter() {
    if (this.id) {
      this.getGuardian(this.id);
    }
  }

  /**
   * Retrieves a guardian by their ID.
   * @param guardianId The ID of the guardian to retrieve.
   */
  getGuardian(guardianId: string) {
    this.guardianService
      .getGuardian(guardianId)
      .pipe()
      .subscribe((guardian) => {
        this.guardian.set(guardian);
        this.mapProfileDetails(guardian);
        this.mapProfileOverview(guardian);
        this.mapLinkedGuardians(guardian);
      });
  }

  deactivateGuardian() {
    this.guardianService.deactivateGuardian(this.id!).subscribe({
      next: () => {
        this.toastr.success(
          '',
          this.translocoService.translate(
            'global.successfully_deactivated.txt',
          ),
        );
        this.getGuardian(this.id!);
      },
      error: ({ error }) => {
        this.toastr.showBackendError(error);
        this.deactivateGuardian();
      },
    });
  }

  activateGuardian() {
    this.guardianService.activateGuardian(this.id!).subscribe({
      next: () => {
        this.toastr.success(
          '',
          this.translocoService.translate('global.successfully_activated.txt'),
        );
        this.getGuardian(this.id!);
      },
      error: ({ error }) => {
        this.toastr.error(
          '',
          error.message ||
            this.translocoService.translate(
              'user_management.account.activation.error',
            ),
        );
        this.deactivateGuardian();
      },
    });
  }

  /**
   * Maps the profile details of a guardian to the profileDetails array.
   *
   * @param guardian - The guardian object containing the profile details.
   */
  mapProfileDetails(guardian: Guardian) {
    this.profileDetails.set([
      {
        title: this.translocoService.translate('global.full_name.title'),
        value: guardian.displayName,
        required: true,
      },
      {
        title: this.translocoService.translate('global.phone_number.title'),
        value: guardian.countryCode + ' ' + guardian.phoneNumber,
        type: 'phoneNumber',
      },
      {
        title: this.translocoService.translate('global.national_id.title'),
        value: guardian.nationalId,
      },
      {
        title: this.translocoService.translate(
          'user_management.guardian_id.txt',
        ),
        value: guardian.id.toString(),
      },
      {
        title: this.translocoService.translate('global.gender.title'),
        value: guardian.gender,
        isEnum: true,
      },
    ]);
  }

  /**
   * Maps the profile overview for a guardian.
   *
   * @param guardian - The guardian object.
   */
  mapProfileOverview(guardian: Guardian) {
    const uniqueSchools = this.getUniqueSchools(guardian);
    this.metadata.set([
      {
        hesIcon: {
          src: 'assets/icons/school.svg',
          class: 'text-base',
        },
        title:
          uniqueSchools.length <= 2
            ? uniqueSchools.join(', ')
            : `${uniqueSchools.slice(0, 2).join(', ')} + ${uniqueSchools.length - 2} ${this.translocoService.translate('global.more.txt')}`,
      },
      {
        faIcon: {
          icon: faUser,
          primaryOpacity: 0.3,
          secondaryOpacity: 1.0,
          primaryColor: '#ECAD01',
          secondaryColor: '#ECAD01',
        },
        title: guardian.type
          ? guardian.type
          : this.translocoService.translate('global.guardian.txt'),
      },
    ]);
  }

  private getUniqueSchools(guardian: Guardian) {
    return Array.from(
      new Set(
        guardian.schools
          ?.map((item) => item?.displayName ?? '')
          .filter((school) => school !== ''),
      ),
    );
  }

  /**
   * Maps the guardians of a guardian to an array of linked guardians.
   *
   * @param guardian - The guardian object containing the guardians.
   */
  mapLinkedGuardians(guardian: Guardian) {
    const linkedStudents: IlinkedGuardian[] = [];
    guardian.students.forEach((student) => {
      linkedStudents.push({
        fullName: student.displayName,
        nationalId: student.nationalId,
        id: student.id.toString(),
        mobileNumber: student.phoneNumber
          ? student.countryCode + ' ' + student.phoneNumber
          : '-',
        relationship: student.studentRelationship,
        imageUrl: student.imageUrl ?? '',
        status: student.status,
        onUnlinkProfile: () => this.onUnlinkStudent(student.id.toString()),
        onViewProfile: () => this.viewStudentProfile(student.id.toString()),
      });
    });
    this.linkedStudents.set(linkedStudents);
  }

  /**
   * Navigates to the update guardian page.
   */
  goToUpdateGuardianPage = () => {
    this.router.navigate(['user-management/guardians', this.id, 'update'], {
      state: { origin: 'profile' },
    });
  };

  /**
   * Unlinks a guardian from the guardian.
   *
   * @param studentId - The ID of the student to unlink.
   */
  unlinkStudent = (studentId: string) => {
    if (this.id) {
      this.studentService.unlinkGuardian(studentId, this.id).subscribe({
        next: () => {
          this.toastr.success(
            '',
            this.translocoService.translate(
              'user_management.student.unlink.success',
            ),
          );
          this.getGuardian(this.id!);
        },
        error: ({ error }) => {
          this.toastr.showBackendError(error);
          this.unlinkStudent(studentId);
        },
      });
    }
  };

  /**
   * Navigates to the student profile page.
   *
   * @param studentId - The ID of the student.
   */
  viewStudentProfile(studentId: string) {
    this.router.navigate(['user-management/students', studentId]);
  }

  /* feedback modal methods */
  async onUnlinkStudent(studentId: string) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'user_management.action.guardian.student.unlink',
        ),
        modalMessage: this.translocoService.translate(
          'user_management.action.guardian.student.unlink.message',
        ),
        primaryBtnStr: this.translocoService.translate(
          'user_management.yes_unlink.btn',
        ),
        secondaryBtnStr: this.translocoService.translate(
          'global.no_cancel.btn',
        ),
      },
      () => this.unlinkStudent(studentId),
    );
  }

  onDeactivateGuardian = () => {
    this.guardianService.onDeactivateGuardian(() => this.deactivateGuardian());
  };

  onActivateGuardian() {
    this.guardianService.onActivateGuardian(() => this.activateGuardian());
  }
  onRefreshProfile = () => {
    this.getGuardian(this.id!);
  };
  protected readonly UserType = UserType;
}
