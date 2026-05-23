import {
  Component,
  computed,
  Input,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faUser } from '@fortawesome/pro-duotone-svg-icons';
import {
  ProfileHeaderComponent,
  profileMetadata,
} from '@shared/components/profile-header/profile-header.component';
import {
  IProfileDetails,
  ProfileDetailsComponent,
} from '@shared/components/profile-details/profile-details.component';
import { PersonnelService } from '../personnel.service';
import { Router } from '@angular/router';
import {
  TranslocoDirective,
  TranslocoModule,
  TranslocoService,
} from '@jsverse/transloco';
import { ProfileLoginMethodsComponent } from '@shared/components/profile-login-methods/profile-login-methods.component';
import { HesAlertComponent } from '@ui-kit/hes-alert/hes-alert.component';
import { HesAuthDirective } from '@auth/hes-auth.directive';
import { PersonnelStatusService } from '../utils/personnel-status.service';
import { Subscription, forkJoin, of, catchError } from 'rxjs';
import { ConnectedProfileComponent } from '@shared/components/connected-profile/connected-profile.component';
import { UserProfileColors, UserType } from '@shared/enums';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { IonContent } from '@ionic/angular/standalone';
import { SchoolStructureControlValue } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { mapAssociationToFormControlValue } from '../utils/map-association-to-form-control-value.util';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { getSchoolStructureControlValueToRest } from '@shared/utils/get-school-structure-control-value-to-rest.util';
import { AuthService } from '@auth/auth.service';
import {
  AssociatePersonnelData,
  Personnel,
  SubjectAssociation,
} from '@shared/dto-transformation';
import { DsSelectComponent } from '@ds/select/select.component';
import { DsSelectConfig, DsSelectOption } from '@ds/select/select.interface';

@Component({
  selector: 'app-student-profile',
  templateUrl: './personnel-profile.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProfileHeaderComponent,
    ProfileDetailsComponent,
    ProfileLoginMethodsComponent,
    HesAlertComponent,
    HesAuthDirective,
    TranslocoModule,
    ConnectedProfileComponent,
    TranslocoDirective,
    DsSelectComponent,
  ],
})
export class PersonnelProfilePage implements OnDestroy {
  /**
   * The ID of the personnel.
   * @type {string | null}
   */
  @Input() id: string | null = null;
  userType: UserType = UserType.PERSONNEL;
  authService = inject(AuthService);
  private readonly personnelStatusService = inject(PersonnelStatusService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  readonly hasSchoolStructurePermission = this.rbac.hasPermission(
    RESOURCE_PERMISSION.personnel.associateSchoolStructure,
  );
  readonly hasSubjectAssociationPermission = this.rbac.hasPermission(
    RESOURCE_PERMISSION.personnel.associateSubjects,
  );
  personnel = signal<Personnel | undefined>(undefined);
  subjects = signal<SubjectAssociation[]>([]);
  private allSubjects = signal<Array<{ id: number; displayName: string }>>([]);
  private courseLinkedSubjectIds = signal<Set<number>>(new Set());
  subjectsList = computed<DsSelectOption[]>(() => {
    const linked = this.courseLinkedSubjectIds();
    return this.allSubjects().map((s) => ({
      id: s.id,
      display: s.displayName,
      disabled: linked.has(s.id),
    }));
  });
  subjectsConfig = computed<DsSelectConfig>(() => ({
    options: this.subjectsList(),
    placeholder: this.translocoService.translate(
      'grade_management.select_subjects.title',
    ),
    isMultiple: true,
    showSelectAll: true,
  }));
  subjectsControl = new FormControl<number[]>([]);
  private savedSubjectIds: number[] = [];
  metadata = signal<profileMetadata[]>([]);
  profileDetails = signal<IProfileDetails[]>([]);
  private readonly subscription = new Subscription();
  readonly updatePersonnelPermissionId =
    RESOURCE_PERMISSION.personnel.editPersonnelProfile;
  readonly changePhoneNumberPermissionId =
    RESOURCE_PERMISSION.personnel.changePhoneNumber;
  readonly activateDeactiveProfilePermissionId =
    RESOURCE_PERMISSION.personnel.decativateActivateProfile;
  associateSchoolControl = new FormControl<SchoolStructureControlValue[]>([]);
  userProfileColors = UserProfileColors;
  constructor(
    private personnelService: PersonnelService,
    private router: Router,
    private translocoService: TranslocoService,
    private toaster: HesToasterService,
  ) {}

  ionViewWillEnter() {
    if (this.id) {
      this.getPersonnel(this.id);
    }

    if (this.hasSubjectAssociationPermission) {
      this.personnelService.getSubjects().subscribe((subjects) => {
        this.allSubjects.set(subjects);
      });
    }

    this.subscription.add(
      this.personnelStatusService.actionComplete$.subscribe(() => {
        if (this.id) this.getPersonnel(this.id);
      }),
    );
  }

  onCloseAssociateSchoolModal(value: SchoolStructureControlValue[]) {
    if (this.associateSchoolControl.dirty) {
      this.personnelService
        .associatePersonnelWithSchoolsStructure(
          +this.id!,
          getSchoolStructureControlValueToRest(value!),
        )
        .subscribe({
          next: () => {
            this.getPersonnel(this.id!);
            this.associateSchoolControl.markAsPristine();
            this.toaster.success(
              this.translocoService.translate(
                'user_management.successfully_updating_account.txt',
              ),
            );
          },
          error: (error) => {
            this.getPersonnel(this.id!);
            this.toaster.showBackendError(error);
          },
        });
    }
  }
  /**
   * Retrieves a personnel by their ID.
   * @param personnelId The ID of the personnel to retrieve.
   */
  getPersonnel(personnelId: string | number) {
    forkJoin([
      this.personnelService.getPersonnel(personnelId),
      this.personnelService.getAssociatePersonnel(personnelId),
      this.personnelService
        .getPersonnelSubjectAssociation(personnelId)
        .pipe(catchError(() => of([]))),
    ]).subscribe(([personnel, association, subjects]) => {
      this.personnel.set(personnel);
      this.subjects.set(subjects);
      this.savedSubjectIds = subjects.map((s) => s.subjectId);
      this.courseLinkedSubjectIds.set(
        new Set(subjects.filter((s) => s.hasCourse).map((s) => s.subjectId)),
      );
      this.subjectsControl.setValue(this.savedSubjectIds, { emitEvent: false });
      this.mapProfileDetails(personnel);
      this.mapProfileOverview(association);
      this.associateSchoolControl.setValue(
        mapAssociationToFormControlValue(association),
      );
    });
  }

  /**
   * Maps the profile details of a personnel to the profileDetails array.
   *
   * @param personnel - The personnel object containing the profile details.
   */
  mapProfileDetails(personnel: Personnel) {
    this.profileDetails.set([
      {
        title: this.translocoService.translate('global.full_name.title'),
        value: personnel.displayName,
        required: true,
      },
      {
        title: this.translocoService.translate('global.phone_number.title'),
        value: personnel.countryCode + ' ' + personnel.phoneNumber,
        type: 'phoneNumber',
      },
      {
        title: this.translocoService.translate('global.national_id.title'),
        value: personnel.nationalId,
      },
      {
        title: this.translocoService.translate('global.email.label'),
        value: personnel.email,
      },
      {
        title: this.translocoService.translate('global.employee_id.title'),
        value: personnel.employeeIdentifier,
      },
      {
        title: this.translocoService.translate('global.role.title'),
        value:
          personnel.roles?.map(({ displayName }) => displayName).join(', ') ??
          '',
      },
      {
        title: this.translocoService.translate('global.nationality.title'),
        value: personnel.nationality?.displayName ?? '',
      },
      {
        title: this.translocoService.translate('global.gender.title'),
        value: personnel.gender,
        isEnum: true,
      },
      {
        title: this.translocoService.translate(
          'global.passport_number_expiry_date.title',
        ),
        value: personnel.passportNumber ?? '-',
        secondaryValue: personnel.passportExpiryDate,
        isSecondaryValueDate: true,
      },
      {
        title: this.translocoService.translate('global.date_of_birth.title'),
        value: personnel.dateOfBirth ?? '-',
      },
      {
        title: this.translocoService.translate('global.start_date.title'),
        value: personnel.startDate ?? '-',
      },
    ]);
  }

  /**
   * Maps the profile overview for a personnel.
   *
   * @param personnel - The personnel object.
   */
  mapProfileOverview(association: AssociatePersonnelData) {
    this.metadata.set([
      {
        faIcon: {
          icon: faUser,
          primaryOpacity: 0.3,
          secondaryOpacity: 1.0,
          primaryColor: '#ECAD01',
          secondaryColor: '#ECAD01',
        },
        title: this.translocoService.translate('global.personnel.txt'),
      },
      {
        hesIcon: {
          src: 'assets/icons/school.svg',
          class: 'text-base',
        },
        title: this.getAssociationText(association),
      },
    ]);
  }

  /**
   * Navigates to the update personnel page.
   */
  goToUpdatePersonnelPage = () => {
    this.router.navigate(['user-management/personnels', this.id, 'update'], {
      state: { origin: 'profile' },
    });
  };

  onDeactivatePersonnel = async () => {
    if (this.id) {
      this.personnelStatusService.onDeactivatePersonnel(this.id?.toString());
    }
  };

  async onActivatePersonnel() {
    if (this.id) {
      this.personnelStatusService.onActivatePersonnel(this.id.toString());
    }
  }

  onSubjectsDropdownClosed() {
    if (!this.id) return;
    const currentIds = (this.subjectsControl.value ?? []).slice().sort();
    const savedIds = this.savedSubjectIds.slice().sort();
    if (JSON.stringify(currentIds) === JSON.stringify(savedIds)) return;

    this.personnelService
      .associatePersonnelWithSubjects(this.id, this.subjectsControl.value ?? [])
      .subscribe({
        next: () => {
          this.savedSubjectIds = this.subjectsControl.value ?? [];
          this.toaster.success(
            this.translocoService.translate(
              'user_management.successfully_updating_account.txt',
            ),
          );
        },
        error: (error) => {
          this.toaster.showBackendError(error);
          this.getPersonnel(this.id!);
        },
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  onRefreshProfile = () => {
    this.getPersonnel(this.id!);
  };

  private getAssociationText(association: AssociatePersonnelData) {
    let result: string[] = [];
    const toPush = (entites: Array<{ id: number; displayName: string }>) => {
      entites?.forEach((item) => {
        result.push(item.displayName);
      });
    };
    toPush(association.companies);
    toPush(association.campuses);
    toPush(association.schools);
    if (result.length === 0) {
      return this.translocoService.translate(
        'global.user_management.no_association.txt',
      );
    }
    if (result.length <= 2) {
      return result.join(', ');
    }
    return `${result.slice(0, 2).join(', ')}, ${result.length - 2} ${this.translocoService.translate('global.more.txt')}`;
  }

  protected readonly UserType = UserType;
}
