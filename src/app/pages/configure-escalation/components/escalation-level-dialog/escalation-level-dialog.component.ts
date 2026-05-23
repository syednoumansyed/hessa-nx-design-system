import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { faCalendarDays } from '@fortawesome/pro-solid-svg-icons';

import { faUserTieHair } from '@fortawesome/pro-duotone-svg-icons';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { Subject } from 'rxjs';
import { PersonnelService } from '@pages/user-management/personnels/personnel.service';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { ConfigureEscalationService } from '@pages/configure-escalation/data-access/configure-escalation.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { DEFAULT_ESCALATION_DAYS } from '@pages/help-center/constants/helo-center.constant';
import {
  CreateEscalationRequest,
  EscalationLevel,
  EscalationPersonnel,
  EscalationTypeDetails,
} from '@pages/configure-escalation/data-access/configure-escalation.interface';
import { Personnel } from '@shared/dto-transformation';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import {
  DsModalHeaderConfig,
  DsModalFooterConfig,
} from '@ds/modal/modal.component';

@Component({
  selector: 'app-escalation-level-dialog',
  templateUrl: './escalation-level-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
    HesIconComponent,
    FontAwesomeModule,
  ],
  providers: [SchoolStructureListingService],
})
export class EscalationLevelDialogComponent
  implements OnInit, DsModalContentComponent
{
  customTemplate = viewChild<TemplateRef<any>>('customselectOption');
  faCalendarDays = faCalendarDays;
  faUserTieHair = faUserTieHair;
  @Input() escalation: EscalationTypeDetails;
  @Input() onRefresh: Subject<void>;
  @Input() updateData: EscalationLevel;
  @Input() isEdit: boolean;

  closeModal!: (data?: unknown, role?: string) => void;

  private toastr = inject(HesToasterService);
  selectedSchool = signal<sideMenuSchoolStructureItem | null>(null);
  private schoolScopeService = inject(SchoolStructureScopeService);
  private personnelService = inject(PersonnelService);
  private readonly nonNullablefb = inject(NonNullableFormBuilder);
  private translocoService = inject(TranslocoService);
  configureEscalationService = inject(ConfigureEscalationService);

  form = this.nonNullablefb.group({
    personnels: this.nonNullablefb.control([] as number[], Validators.required),
    days: this.nonNullablefb.control<number>(DEFAULT_ESCALATION_DAYS, [
      Validators.required,
      Validators.max(31),
      Validators.min(1),
    ]),
  });

  formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('support_ticket.nominated_user.dropdown'),
        labelIcon: 'assets/icons/user.svg',
        placeholder: this.translate('support_ticket.select_user.dropdown'),
        type: 'searchable-select',
        selectValues: this.personnelService.personnelsDropdownList(),
        formControlName: 'personnels',
        required: true,
        isMultiple: true,
        searchableSelectObject: {
          pagination: this.personnelService.personnelsPagination(),
          selectOptionTemplate: this.customTemplate(),
          searchable: true,
          onloadMore: (ev: InfiniteScrollCustomEvent) => {
            this.personnelService.getPersonnelsList(
              this.selectedSchool()?.id!,
              {
                pageNumber:
                  this.personnelService.personnelsPagination()?.pageNumber! + 1,
              },
              true,
              false,
              ev,
            );
          },
          onSearchChanged: (value: string) => {
            if (value)
              this.personnelService.updatePersonnelsListSearchText(value);
            else
              this.personnelService.updatePersonnelsListSearchText(undefined);
            this.personnelService.getPersonnelsList(
              this.selectedSchool()?.id!,
              {},
            );
          },
        },
      },
      {
        label: this.translate('support_ticket.auto_escalation_time.dropdown'),
        labelIcon: 'assets/icons/clock.svg',
        type: 'input',
        inputType: 'number',
        placeholder: this.translate(
          'support_ticket.select_number_of_days.dropdown',
        ),
        formControlName: 'days',
        required: true,
        helperText: this.translate('support_ticket.ticket_note.txt'),
      },
    ];
  });

  ngOnInit() {
    this.selectedSchool.set(
      this.schoolScopeService.selectedSchoolStructureItem(),
    );

    if (this.isEdit) {
      this.form.patchValue({
        personnels: this.updateData.personnels.map(
          (personnel: EscalationPersonnel) => personnel.personnelId,
        ),
        days: +this.updateData.days,
      });
    }

    this.personnelService.getPersonnelsList(this.selectedSchool()?.id!, {});

    this.primaryButtonDisabled.set(this.form.invalid);
    this.form.statusChanges.subscribe(() => {
      this.primaryButtonDisabled.set(this.form.invalid);
    });
  }

  determineEscalationlevelTxt() {
    if (!this.isEdit) {
      return (
        this.translocoService.translate('global.level.title') +
        ' ' +
        this.escalation.escalations.length
      );
    } else {
      return this.updateData.levelNumber === 0
        ? this.translate('support_ticket.default_escalation_level.title')
        : this.translocoService.translate('global.level.title') +
            ' ' +
            this.updateData.levelNumber;
    }
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  onEdit() {
    this.primaryButtonLoading.set(true);
    this.configureEscalationService
      .updateEscalationLevel(this.updateData.id, this.makeApiData())
      .subscribe({
        next: () => {
          this.onRefresh.next();
          this.closeModal(undefined, 'confirm');
          this.toastr.success(
            this.translate(
              'support_ticket.escalation_level_successfully_updated.txt',
            ),
          );
        },
        error: (errResp) => {
          this.toastr.showBackendError(errResp);
          this.primaryButtonLoading.set(false);
        },
      });
  }

  onSave() {
    this.primaryButtonLoading.set(true);
    this.configureEscalationService
      .createEscalationLevel(this.makeApiData() as CreateEscalationRequest)
      .subscribe({
        next: () => {
          this.onRefresh.next();
          this.closeModal(undefined, 'confirm');
          this.toastr.success(
            this.translate(
              'support_ticket.escalation_level_successfully_added..txt',
            ),
          );
        },
        error: (errResp) => {
          this.toastr.showBackendError(errResp);
          this.primaryButtonLoading.set(false);
        },
      });
  }

  joinRoleNames(roles: Personnel['roles']) {
    return roles.map((role) => role.displayName).join(', ');
  }

  makeApiData() {
    const { personnels, days } = this.form.getRawValue();
    if (this.isEdit) {
      return {
        personnelIds: personnels,
        days,
      };
    } else {
      return {
        supportTypeId: this.escalation.supportType.id,
        schoolId: this.selectedSchool()?.id,
        days: days?.toString(),
        personnelIds: personnels,
      };
    }
  }

  // Button state signals (watched by modal wrapper)
  readonly primaryButtonDisabled = signal(true);
  readonly primaryButtonLoading = signal(false);

  readonly headerConfig = computed<DsModalHeaderConfig | undefined>(() => {
    if (!this.isEdit) {
      return {
        title: this.translate('support_ticket.add_escalation_levels.title'),
        showCloseButton: true,
      };
    }
    return {
      title:
        this.updateData?.levelNumber === 0
          ? this.translate('support_ticket.default_assigning_of_ticket.title')
          : this.translate('support_ticket.edit_escalation_levels.title'),
      showCloseButton: true,
    };
  });

  readonly footerConfig = computed<DsModalFooterConfig | undefined>(() => {
    return {
      primaryButton: { text: this.translate('global.save.btn') },
      secondaryButton: { text: this.translate('global.cancel.btn') },
      buttonSize: 'lg',
      fullWidthButtons: true,
    };
  });

  onPrimaryClick(): void {
    this.isEdit ? this.onEdit() : this.onSave();
  }

  onSecondaryClick(): void {
    this.closeModal(undefined, 'cancel');
  }
}
