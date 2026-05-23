import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { IonContent } from '@ionic/angular/standalone';
import {
  TranslocoDirective,
  TranslocoModule,
  TranslocoService,
} from '@jsverse/transloco';
import { GuardianService } from '@pages/user-management/guardians/guardians.service';
import { PersonnelService } from '@pages/user-management/personnels/personnel.service';
import { mapAssociationToFormControlValue } from '@pages/user-management/personnels/utils/map-association-to-form-control-value.util';
import { StudentsService } from '@pages/user-management/students/students.service';
import { ProfileContactHeaderComponent } from '@shared/components/profile-contact-header/profile-contact-header.component';
import { IconCardComponent } from '@shared/components/icon-card/icon-card.component';
import {
  ProfileSectionDetailItem,
  ProfileSectionDetailsComponent,
} from '@shared/components/profile-section-details/profile-section-details.component';
import {
  AssociatePersonnelData,
  Guardian,
  Personnel,
  Student,
} from '@shared/dto-transformation';
import { UserProfileColors, UserType } from '@shared/enums';
import { HesDateTimePipe } from '@shared/pipes/hes-date-time.pipe';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import {
  DsSchoolStructureControlValue,
  DsSchoolStructureEntityType,
} from '@ds/school-structure-control/types/school-structure-control.types';
import { DsSchoolStructureSelectionModalComponent } from '@ds/school-structure-control/ds-school-structure-selection-modal.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { StructureDepth } from '@shared/utils/school-structure';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { forkJoin } from 'rxjs';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { openUploadPictureModal } from '@pages/pickup/uplaod-picture-modal';
import { DsModalService } from '@ds/modal/modal.service';
import { DsSidebarService } from '@ds/sidebar/sidebar.service';
import { LayoutService } from '@layout/layout.service';
import {
  ProfileSubjectListComponent,
  ProfileSubjectItem,
} from './components/profile-subject-list.component';

type ProfileSection =
  | 'overview'
  | 'personnel'
  | 'identification'
  | 'supplementary'
  | 'subjects';
type LoadedProfile = Student | Guardian | Personnel;

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    TranslocoModule,
    TranslocoDirective,
    ProfileContactHeaderComponent,
    IconCardComponent,
    ProfileSectionDetailsComponent,
    HesDateTimePipe,
    EnumLangPipe,
    AvatarComponent,
    DsIconComponent,
  ],
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);
  private readonly studentService = inject(StudentsService);
  private readonly guardianService = inject(GuardianService);
  private readonly personnelService = inject(PersonnelService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly modalService = inject(DsModalService);
  private readonly sidebarService = inject(DsSidebarService);
  readonly layoutService = inject(LayoutService);

  readonly userType = computed(() => this.auth.user()?.type ?? null);
  readonly associationDepth = StructureDepth.SCHOOL;
  readonly personalCardIcon = 'assets/icons/user-colored.svg';
  readonly identificationCardIcon = 'assets/icons/export-colored.svg';
  readonly academicCardIcon = 'assets/icons/organisation.svg';
  readonly organisationsCardIcon = 'assets/icons/organisation.svg';
  readonly subjectsCardIcon = 'assets/icons/subjects.svg';
  readonly chevronRight = faChevronRight;

  readonly profile = signal<LoadedProfile | undefined>(undefined);
  readonly personnelAssociation = signal<AssociatePersonnelData | undefined>(
    undefined,
  );
  readonly associationValues = signal<DsSchoolStructureControlValue[]>([]);
  readonly selectedSection = signal<ProfileSection>('overview');
  readonly personalDetails = signal<ProfileSectionDetailItem[]>([]);
  readonly identificationDetails = signal<ProfileSectionDetailItem[]>([]);
  readonly supplementaryDetails = signal<ProfileSectionDetailItem[]>([]);
  readonly subjectsDetails = signal<ProfileSectionDetailItem[]>([]);
  readonly subjectAssociationCount = signal(0);
  readonly subjectItems = signal<ProfileSubjectItem[]>([]);

  // Student's own guardians list (when logged in as student)
  readonly studentGuardiansList = signal<
    Array<{
      displayName: string;
      guardianRelationship: string;
      profileColor?: UserProfileColors;
    }>
  >([]);

  // Guardian-specific signals
  readonly guardianOverviewDetails = signal<ProfileSectionDetailItem[]>([]);
  readonly guardianStudentsList = signal<
    Array<{
      id: string;
      displayName: string;
      relationship: string;
      imageUrl: string | null;
      profileColor?: UserProfileColors;
      isPasswordSetup?: boolean;
    }>
  >([]);

  // Student sub-view signals (when viewing a student from guardian profile)
  readonly isViewingStudent = signal(false);
  readonly viewedStudent = signal<Student | undefined>(undefined);
  readonly viewedStudentPersonalDetails = signal<ProfileSectionDetailItem[]>(
    [],
  );
  readonly viewedStudentIdentificationDetails = signal<
    ProfileSectionDetailItem[]
  >([]);
  readonly viewedStudentSupplementaryDetails = signal<
    ProfileSectionDetailItem[]
  >([]);
  readonly viewedStudentSection = signal<ProfileSection>('overview');
  readonly viewedStudentGuardians = signal<
    Array<{
      displayName: string;
      guardianRelationship: string;
      profileColor?: UserProfileColors;
    }>
  >([]);

  readonly personalCardTitle = computed(() =>
    this.normalizeTitle(
      this.translocoService.translate('profile.personal_details.txt'),
    ),
  );
  readonly identificationCardTitle = computed(() =>
    this.normalizeTitle(
      this.translocoService.translate('profile.identification_details.txt'),
    ),
  );
  readonly supplementaryCardTitle = computed(() => {
    if (this.userType() === UserType.STUDENT) {
      return this.normalizeTitle(
        this.translocoService.translate('profile.academic_details.txt'),
      );
    }

    return this.normalizeTitle(
      this.translocoService.translate('profile.associated_organisations.txt'),
    );
  });
  readonly supplementaryCardIcon = computed(() =>
    this.userType() === UserType.STUDENT
      ? this.academicCardIcon
      : this.organisationsCardIcon,
  );
  readonly subjectsCardTitle = computed(() =>
    this.normalizeTitle(
      this.translocoService.translate('profile.associated_subjects.txt'),
    ),
  );
  readonly showSubjectsCard = computed(
    () => this.userType() === UserType.PERSONNEL,
  );
  readonly hasProfileImagePermission = computed(() =>
    this.rbac.hasPermission(RESOURCE_PERMISSION.student.uploadProfilePicture),
  );
  readonly activeSectionItems = computed(() => {
    switch (this.selectedSection()) {
      case 'personnel':
        return this.personalDetails();
      case 'identification':
        return this.identificationDetails();
      case 'supplementary':
        return this.supplementaryDetails();
      case 'subjects':
        return this.subjectsDetails();
      default:
        return [];
    }
  });
  readonly viewedStudentHeaderName = computed(
    () => this.viewedStudent()?.displayName ?? '',
  );
  readonly viewedStudentHeaderImageUrl = computed(
    () => this.viewedStudent()?.imageUrl ?? null,
  );
  readonly viewedStudentHeaderProfileColor = computed(
    () => this.viewedStudent()?.profileColor ?? UserProfileColors.NEUTRAL,
  );
  readonly viewedStudentHeaderPhoneNumber = computed(
    () => this.viewedStudent()?.displayPhoneNumber ?? '-',
  );
  readonly viewedStudentActiveSectionItems = computed(() => {
    switch (this.viewedStudentSection()) {
      case 'personnel':
        return this.viewedStudentPersonalDetails();
      case 'identification':
        return this.viewedStudentIdentificationDetails();
      case 'supplementary':
        return this.viewedStudentSupplementaryDetails();
      default:
        return [];
    }
  });

  readonly headerName = computed(() => this.profile()?.displayName ?? '');
  readonly headerPhoneNumber = computed(() => {
    const profile = this.profile();

    if (!profile) return '-';

    if ('displayPhoneNumber' in profile && profile.displayPhoneNumber) {
      return profile.displayPhoneNumber;
    }

    return '-';
  });
  readonly headerImageUrl = computed(() => {
    const profile = this.profile();

    if (profile && this.userType() === UserType.STUDENT) {
      return (profile as Student).imageUrl ?? null;
    }

    return null;
  });
  readonly headerProfileColor = computed(
    () => this.profile()?.profileColor ?? UserProfileColors.NEUTRAL,
  );
  readonly viewedStudentLastActiveDate = computed(
    () => this.viewedStudent()?.lastActive ?? null,
  );
  readonly lastActiveDate = computed(() => {
    const profile = this.profile();

    if (!profile) return null;

    if (this.isStudent(profile)) {
      return profile.lastActive;
    }

    return profile.userEvent?.[0]?.createdAt ?? null;
  });

  constructor() {
    this.route.url
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((segments) => {
        // Check for studentId in parent route params (nested route structure)
        const studentId =
          this.route.snapshot.paramMap.get('studentId') ??
          this.route.snapshot.parent?.paramMap.get('studentId');

        if (studentId) {
          const section =
            segments.length > 0 ? segments[segments.length - 1].path : '';
          this.isViewingStudent.set(true);
          this.viewedStudentSection.set(this.getSectionFromParam(section));
          this.loadStudentProfile(studentId);
        } else {
          // Also handle the legacy flat route: student/:id in URL segments
          const paths = segments.map((s) => s.path);
          const studentIdx = paths.indexOf('student');
          if (studentIdx !== -1 && paths[studentIdx + 1]) {
            const id = paths[studentIdx + 1];
            const section = paths[studentIdx + 2] ?? '';
            this.isViewingStudent.set(true);
            this.viewedStudentSection.set(this.getSectionFromParam(section));
            this.loadStudentProfile(id);
          } else {
            this.isViewingStudent.set(false);
            this.viewedStudent.set(undefined);
            const section =
              segments.length > 0 ? segments[segments.length - 1].path : '';
            this.selectedSection.set(this.getSectionFromParam(section));
          }
        }
      });
  }

  ionViewWillEnter() {
    const user = this.auth.user();

    if (!user) return;

    switch (user.type) {
      case UserType.STUDENT:
        this.loadStudent(user.userTypeId);
        break;
      case UserType.GUARDIAN:
        this.loadGuardian(user.userTypeId);
        break;
      case UserType.PERSONNEL:
        this.loadPersonnel(user.userTypeId);
        break;
    }
  }

  openSection(section: ProfileSection) {
    const urlSegment =
      section === 'supplementary' && this.userType() === UserType.STUDENT
        ? 'academic'
        : section;
    void this.router.navigate(['/profile', urlSegment]);
  }

  async openAssociatedOrganisations() {
    const count = this.associationValues().length;
    const title = count
      ? `${this.supplementaryCardTitle()} (${count})`
      : this.supplementaryCardTitle();

    await this.sidebarService.open({
      component: DsSchoolStructureSelectionModalComponent,
      componentProps: {
        initialSelection: this.associationValues(),
        depth: this.associationDepth,
        searchTypes: [
          'school',
          'campus',
          'company',
        ] as DsSchoolStructureEntityType[],
        isMultiSelect: true,
        showSearch: false,
        requireSelection: false,
        showHeader: false,
        showFooter: false,
        readOnly: true,
      },
      headerConfig: {
        title,
        showCloseButton: true,
      },
    });
  }

  async openAssociatedSubjects() {
    const count = this.subjectAssociationCount();
    const title = count
      ? `${this.subjectsCardTitle()} (${count})`
      : this.subjectsCardTitle();

    await this.sidebarService.open({
      component: ProfileSubjectListComponent,
      componentProps: { subjects: this.subjectItems() },
      headerConfig: {
        title,
        showCloseButton: true,
      },
    });
  }

  openChangePassword() {
    void this.router.navigate(['/profile', 'change-password']);
  }

  openStudentChangePassword() {
    const studentId = this.viewedStudent()?.id;
    if (!studentId) return;
    void this.router.navigate([
      '/profile',
      'student',
      studentId,
      'change-password',
    ]);
  }

  openChangeNumber() {
    void this.router.navigate(['/profile', 'change-number']);
  }

  openStudentChangeNumber() {
    const studentId = this.viewedStudent()?.id;
    if (!studentId) return;
    void this.router.navigate([
      '/profile',
      'student',
      studentId,
      'change-number',
    ]);
  }

  onStudentSelected(studentId: string) {
    void this.router.navigate(['/profile', 'student', studentId]);
  }

  openStudentSection(section: ProfileSection) {
    const studentId = this.viewedStudent()?.id;
    if (!studentId) return;
    const urlSegment = section === 'supplementary' ? 'academic' : section;
    void this.router.navigate(['/profile', 'student', studentId, urlSegment]);
  }

  async initiateProfileUpload(studentId: string | number) {
    try {
      const result = await FilePicker.pickImages({
        limit: 1,
        readData: true,
      });

      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        const imageBase64 = `data:image/jpeg;base64,${file.data}`;

        const profile = this.profile();
        const existingImageUrl =
          this.viewedStudent()?.imageUrl ??
          (profile && 'imageUrl' in profile ? profile.imageUrl : null);

        const profilePicture = await openUploadPictureModal({
          modalService: this.modalService,
          translocoService: this.translocoService,
          profilePicture: imageBase64,
          studentId: +studentId,
          hasExistingImage: !!existingImageUrl,
        });

        if (profilePicture) {
          // Update the image URL in the loaded profile/student
          const profile = this.profile();
          if (profile && 'imageUrl' in profile) {
            this.profile.set({ ...profile, imageUrl: profilePicture });
          }

          const viewedStudent = this.viewedStudent();
          if (viewedStudent) {
            this.viewedStudent.set({
              ...viewedStudent,
              imageUrl: profilePicture,
            });
          }
        }
      }
    } catch {
      // User cancelled the picker
    }
  }

  private loadStudent(id: number | string) {
    this.studentService.getStudent(id).subscribe((student) => {
      this.profile.set(student);
      this.personalDetails.set([
        {
          label: this.translocoService.translate('global.first_name.label'),
          value: student.displayPreferredName || student.displayName,
        },
        {
          label: this.translocoService.translate('global.full_name.title'),
          value: student.displayName,
        },
        {
          label: this.translocoService.translate('global.phone_number.title'),
          value: student.displayPhoneNumber ?? '-',
          type: student.displayPhoneNumber ? 'phoneNumber' : undefined,
          ...(this.rbac.hasPermission(
            RESOURCE_PERMISSION.student.changePhoneNumber,
          ) && student.displayPhoneNumber
            ? {
                actionLabel: this.translocoService.translate(
                  'global.change_number.btn',
                ),
                onAction: () => this.openChangeNumber(),
              }
            : {}),
        },
        {
          label: this.translocoService.translate('global.password.label'),
          value: '********',
          actionLabel: this.translocoService.translate(
            'profile.change_password.title',
          ),
          onAction: () => this.openChangePassword(),
        },
        {
          label: this.translocoService.translate('global.date_of_birth.title'),
          value: student.dateOfBirth ?? '-',
          type: student.dateOfBirth ? 'date' : undefined,
        },
        {
          label: this.translocoService.translate('global.nationality.title'),
          value: student.nationalityName ?? '-',
        },
        {
          label: this.translocoService.translate('global.gender.title'),
          value: student.gender ?? '-',
          type: student.gender ? 'enum' : undefined,
        },
      ]);
      this.identificationDetails.set([
        {
          label: this.translocoService.translate('global.national_id.title'),
          value: student.nationalId || '-',
        },
        {
          label: this.translocoService.translate('global.student_id.title'),
          value: student.id.toString(),
        },
        {
          label: this.translocoService.translate(
            'global.pioneer_student_id.label',
          ),
          value: student.pioneerId || '-',
        },
        {
          label: this.translocoService.translate(
            'global.passport_number.label',
          ),
          value: student.passportNumber || '-',
        },
        {
          label: this.translocoService.translate(
            'global.passport_expiry_date.title',
          ),
          value: student.passportExpiryDate ?? '-',
          type: student.passportExpiryDate ? 'date' : undefined,
        },
        {
          label: this.translocoService.translate('global.academic_year.title'),
          value: student.academicYear?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate(
            'global.registration_date.title',
          ),
          value: student.registrationDate ?? '-',
          type: student.registrationDate ? 'date' : undefined,
        },
      ]);
      this.supplementaryDetails.set([
        {
          label: this.translocoService.translate('global.company.title'),
          value: student.company?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate('global.campus.title'),
          value: student.campus?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate('global.school.title'),
          value: student.school?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate('global.level.title'),
          value: student.level?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate('global.class.title'),
          value: student.class?.displayName ?? '-',
        },
      ]);

      // Map student's guardians for display
      this.studentGuardiansList.set(
        student.guardians.map((g) => ({
          displayName: g.displayName,
          guardianRelationship: g.guardianRelationship ?? '',
          profileColor: g.profileColor,
        })),
      );
    });
  }

  private loadGuardian(id: number | string) {
    this.guardianService.getGuardian(id.toString()).subscribe((guardian) => {
      this.profile.set(guardian);

      // Guardian overview details (shown inline on overview)
      this.guardianOverviewDetails.set([
        {
          label: this.translocoService.translate('global.national_id.title'),
          value: guardian.nationalId || '-',
        },
        {
          label: this.translocoService.translate('global.phone_number.title'),
          value: guardian.displayPhoneNumber ?? '-',
          type: guardian.displayPhoneNumber ? 'phoneNumber' : undefined,
          actionLabel: guardian.displayPhoneNumber
            ? this.translocoService.translate('global.change_number.btn')
            : undefined,
          onAction: guardian.displayPhoneNumber
            ? () => this.openChangeNumber()
            : undefined,
        },
        {
          label: this.translocoService.translate('global.date_of_birth.title'),
          value: '-',
        },
        {
          label: this.translocoService.translate('global.nationality.title'),
          value: '-',
        },
        {
          label: this.translocoService.translate('global.gender.title'),
          value: guardian.gender ?? '-',
          type: guardian.gender ? 'enum' : undefined,
        },
      ]);

      // Map guardian students for profile list
      this.guardianStudentsList.set(
        guardian.students.map((s) => ({
          id: s.id.toString(),
          displayName: s.displayName,
          relationship: s.studentRelationship ?? '',
          imageUrl: s.imageUrl ?? null,
          profileColor: s.profileColor,
          isPasswordSetup: s.isPasswordSetup,
        })),
      );

      // Keep existing detail cards populated for backward compat
      this.personalDetails.set([
        {
          label: this.translocoService.translate('global.first_name.label'),
          value: guardian.displayPreferredName || guardian.displayName,
        },
        {
          label: this.translocoService.translate('global.full_name.title'),
          value: guardian.displayName,
        },
        {
          label: this.translocoService.translate('global.phone_number.title'),
          value: guardian.displayPhoneNumber ?? '-',
          type: guardian.displayPhoneNumber ? 'phoneNumber' : undefined,
        },
        {
          label: this.translocoService.translate('global.email.label'),
          value: guardian.email || '-',
        },
        {
          label: this.translocoService.translate('global.gender.title'),
          value: guardian.gender ?? '-',
          type: guardian.gender ? 'enum' : undefined,
        },
      ]);
      this.identificationDetails.set([
        {
          label: this.translocoService.translate('global.national_id.title'),
          value: guardian.nationalId || '-',
        },
        {
          label: this.translocoService.translate(
            'user_management.guardian_id.txt',
          ),
          value: guardian.id.toString(),
        },
      ]);
      this.supplementaryDetails.set([
        {
          label: this.translocoService.translate('global.company.title'),
          value: this.formatDisplayNames(guardian.companies),
        },
        {
          label: this.translocoService.translate('global.campus.title'),
          value: this.formatDisplayNames(guardian.campuses),
        },
        {
          label: this.translocoService.translate('global.school.title'),
          value: this.formatDisplayNames(guardian.schools),
        },
      ]);
    });
  }

  private loadPersonnel(id: number | string) {
    forkJoin([
      this.personnelService.getPersonnel(id),
      this.personnelService.getAssociatePersonnel(id),
      this.personnelService.getPersonnelSubjectAssociation(id),
    ]).subscribe(([personnel, association, subjects]) => {
      this.profile.set(personnel);
      this.personnelAssociation.set(association);
      this.associationValues.set(mapAssociationToFormControlValue(association));
      this.personalDetails.set([
        {
          label: this.translocoService.translate('global.first_name.label'),
          value: personnel.displayPreferredName || personnel.displayName,
        },
        {
          label: this.translocoService.translate('global.full_name.title'),
          value: personnel.displayName,
        },
        {
          label: this.translocoService.translate('global.phone_number.title'),
          value: personnel.displayPhoneNumber ?? '-',
          type: personnel.displayPhoneNumber ? 'phoneNumber' : undefined,
          ...(this.rbac.hasPermission(
            RESOURCE_PERMISSION.personnel.changePhoneNumber,
          ) && personnel.displayPhoneNumber
            ? {
                actionLabel: this.translocoService.translate(
                  'global.change_number.btn',
                ),
                onAction: () => this.openChangeNumber(),
              }
            : {}),
        },
        {
          label: this.translocoService.translate('global.email.label'),
          value: personnel.email || '-',
        },
        {
          label: this.translocoService.translate('global.date_of_birth.title'),
          value: personnel.dateOfBirth ?? '-',
          type: personnel.dateOfBirth ? 'date' : undefined,
        },
        {
          label: this.translocoService.translate('global.nationality.title'),
          value: personnel.nationality?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate('global.gender.title'),
          value: personnel.gender ?? '-',
          type: personnel.gender ? 'enum' : undefined,
        },
      ]);
      this.identificationDetails.set([
        {
          label: this.translocoService.translate('global.national_id.title'),
          value: personnel.nationalId || '-',
        },
        {
          label: this.translocoService.translate('global.employee_id.title'),
          value: personnel.employeeIdentifier || '-',
        },
        {
          label: this.translocoService.translate('global.role.title'),
          value: personnel.displayRoleNames() || '-',
        },
        {
          label: this.translocoService.translate(
            'global.passport_number.label',
          ),
          value: personnel.passportNumber || '-',
        },
        {
          label: this.translocoService.translate(
            'global.passport_expiry_date.title',
          ),
          value: personnel.passportExpiryDate ?? '-',
          type: personnel.passportExpiryDate ? 'date' : undefined,
        },
        {
          label: this.translocoService.translate('global.start_date.title'),
          value: personnel.startDate ?? '-',
          type: personnel.startDate ? 'date' : undefined,
        },
      ]);
      this.supplementaryDetails.set([
        {
          label: this.translocoService.translate('global.company.title'),
          value: this.formatDisplayNames(association.companies),
        },
        {
          label: this.translocoService.translate('global.campus.title'),
          value: this.formatDisplayNames(association.campuses),
        },
        {
          label: this.translocoService.translate('global.school.title'),
          value: this.formatDisplayNames(association.schools),
        },
      ]);
      this.subjectAssociationCount.set(subjects.length);
      this.subjectItems.set(
        subjects.map((s) => ({ name: s.displayName, icon: s.iconUrl })),
      );
      this.subjectsDetails.set(
        subjects.length > 0
          ? subjects.map((s) => ({
              label: this.translocoService.translate('global.subject.title'),
              value: s.displayName,
            }))
          : [
              {
                label: this.translocoService.translate('global.subject.title'),
                value: '-',
              },
            ],
      );
    });
  }

  private loadStudentProfile(studentId: string) {
    // Skip if already loaded
    if (this.viewedStudent()?.id.toString() === studentId) return;

    this.studentService.getStudent(studentId).subscribe((student) => {
      this.viewedStudent.set(student);
      this.viewedStudentPersonalDetails.set([
        {
          label: this.translocoService.translate('global.first_name.label'),
          value: student.displayPreferredName || student.displayName,
        },
        {
          label: this.translocoService.translate('global.full_name.title'),
          value: student.displayName,
        },
        {
          label: this.translocoService.translate('global.phone_number.title'),
          value: student.displayPhoneNumber ?? '-',
          type: student.displayPhoneNumber ? 'phoneNumber' : undefined,
          ...(this.rbac.hasPermission(
            RESOURCE_PERMISSION.student.changePhoneNumber,
          ) && student.displayPhoneNumber
            ? {
                actionLabel: this.translocoService.translate(
                  'global.change_number.btn',
                ),
                onAction: () => this.openStudentChangeNumber(),
              }
            : {}),
        },
        {
          label: this.translocoService.translate('global.password.label'),
          value: student.isPasswordSetup ? '********' : '',
          actionLabel: student.isPasswordSetup
            ? this.translocoService.translate('profile.change_password.title')
            : this.translocoService.translate('profile.add_password.txt'),
          onAction: () => this.openStudentChangePassword(),
        },
        {
          label: this.translocoService.translate('global.date_of_birth.title'),
          value: student.dateOfBirth ?? '-',
          type: student.dateOfBirth ? 'date' : undefined,
        },
        {
          label: this.translocoService.translate('global.nationality.title'),
          value: student.nationalityName ?? '-',
        },
        {
          label: this.translocoService.translate('global.gender.title'),
          value: student.gender ?? '-',
          type: student.gender ? 'enum' : undefined,
        },
      ]);
      this.viewedStudentIdentificationDetails.set([
        {
          label: this.translocoService.translate('global.national_id.title'),
          value: student.nationalId || '-',
        },
        {
          label: this.translocoService.translate('global.student_id.title'),
          value: student.id.toString(),
        },
        {
          label: this.translocoService.translate(
            'global.pioneer_student_id.label',
          ),
          value: student.pioneerId || '-',
        },
        {
          label: this.translocoService.translate(
            'global.passport_number.label',
          ),
          value: student.passportNumber || '-',
        },
        {
          label: this.translocoService.translate(
            'global.passport_expiry_date.title',
          ),
          value: student.passportExpiryDate ?? '-',
          type: student.passportExpiryDate ? 'date' : undefined,
        },
        {
          label: this.translocoService.translate('global.academic_year.title'),
          value: student.academicYear?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate(
            'global.registration_date.title',
          ),
          value: student.registrationDate ?? '-',
          type: student.registrationDate ? 'date' : undefined,
        },
      ]);
      this.viewedStudentSupplementaryDetails.set([
        {
          label: this.translocoService.translate('global.company.title'),
          value: student.company?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate('global.campus.title'),
          value: student.campus?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate('global.school.title'),
          value: student.school?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate('global.level.title'),
          value: student.level?.displayName ?? '-',
        },
        {
          label: this.translocoService.translate('global.class.title'),
          value: student.class?.displayName ?? '-',
        },
      ]);

      // Map guardians from the student's own guardian list
      this.viewedStudentGuardians.set(
        student.guardians.map((g) => ({
          displayName: g.displayName,
          guardianRelationship: g.guardianRelationship ?? '',
          profileColor: g.profileColor,
        })),
      );
    });
  }

  private getSectionFromParam(section: string): ProfileSection {
    if (section === 'academic') {
      return 'supplementary';
    }
    if (
      section === 'personnel' ||
      section === 'identification' ||
      section === 'supplementary' ||
      section === 'subjects'
    ) {
      return section;
    }

    return 'overview';
  }

  private normalizeTitle(value: string) {
    return value.replace(/\s+/g, ' ').trim();
  }

  private isStudent(
    profile: LoadedProfile | undefined,
  ): profile is Student | undefined {
    return !!profile && this.userType() === UserType.STUDENT;
  }

  private formatDisplayNames(
    values?: Array<{ displayName: string }> | null,
  ): string {
    if (!values || values.length === 0) {
      return '-';
    }

    return values.map((value) => value.displayName).join(', ');
  }

  protected readonly UserType = UserType;
}
