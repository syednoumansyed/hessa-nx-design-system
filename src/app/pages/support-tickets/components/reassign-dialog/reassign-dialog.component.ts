import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { faUserTieHair } from '@fortawesome/pro-duotone-svg-icons';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { EscalationLevel } from '@pages/configure-escalation/data-access/configure-escalation.interface';
import { TICKET_SUPPORT_TYPE } from '@pages/help-center/constants/helo-center.constant';
import { PersonnelService } from '@pages/user-management/personnels/personnel.service';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { Personnel, SupportTicketDetail } from '@shared/dto-transformation';
import { IReassignTicketPayload } from '@shared/interfaces/support-tickets.interface';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-reassign-dialog',
  templateUrl: './reassign-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    HesButtonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [SchoolStructureListingService],
})
export class ReassignDialogComponent implements OnInit {
  //#region Inputs
  @Input() updateData: EscalationLevel;
  @Input() ticketId: string;
  @Input() closeModal: () => void;
  @Input() afterReassigned?: () => void;
  //#endregion

  readonly customTemplate = viewChild<TemplateRef<any>>('customselectOption');

  //#region Icons
  faUserTieHair = faUserTieHair;
  readonly faClose = faClose;
  //#endregion

  //#region Services
  private schoolScopeService = inject(SchoolStructureScopeService);
  private schoolStructureListing = inject(SchoolStructureListingService);
  private supportTicketService = inject(SupportTicketsService);
  private personnelService = inject(PersonnelService);
  private nonNullablefb = inject(NonNullableFormBuilder);
  private translocoService = inject(TranslocoService);
  private toastr = inject(HesToasterService);
  //#endregion

  //#region Signals
  selectedSchool = signal<sideMenuSchoolStructureItem | null>(null);
  selectedSchoolId = this.schoolScopeService.selectedSchoolId; // Can consider computed signal
  ticketDetails = signal<SupportTicketDetail | undefined>(undefined);
  supportTypes = signal<ISelectValue[]>([]);
  supportCategories = signal<ISelectValue[]>([]);
  //#endregion

  //#region Form
  readonly form = this.nonNullablefb.group({
    supportTypeId: this.nonNullablefb.control(0, Validators.required),
    supportCategoryId: this.nonNullablefb.control(0, Validators.required),
    personnels: this.nonNullablefb.control([] as number[], Validators.required),
  });

  readonly formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('support_ticket.category_req.label'),
        placeholder: this.translate('support_ticket.select_type.dropdown'),
        formControlName: 'supportTypeId',
        type: 'searchable-select',
        required: true,
        selectValues: this.supportTypes(),
      },
      {
        label: this.translate('support_tickets.sub_category_title.label'),
        placeholder: this.translate('support_ticket.select_category.dropdown'),
        formControlName: 'supportCategoryId',
        type: 'searchable-select',
        required: true,
        selectValues: this.supportCategories(),
      },
      {
        label: this.translate('support_ticket.nominated_user.dropdown'),
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
          onloadMore: this.loadMorePersonnel.bind(this),
          onSearchChanged: this.searchPersonnel.bind(this),
        },
      },
    ];
  });
  //#endregion

  //#region public Methods
  ngOnInit() {
    this.selectedSchool.set(
      this.schoolScopeService.selectedSchoolStructureItem(),
    );

    this.refetchTicketDetails();

    this.personnelService.getPersonnelsList(
      this.selectedSchoolId()!,
      {
        pageNumber: 1,
      },
      false,
      true,
    );

    this.supportTicketService
      .getSupportsTypesSelectValue()
      .subscribe((types) => {
        const filteredTypes = types?.filter(
          (type) => type?.displayedValue !== TICKET_SUPPORT_TYPE.SUPPORT,
        );
        this.supportTypes.set(filteredTypes);
      });

    this.form.controls.supportTypeId.valueChanges
      .pipe(
        switchMap((value) =>
          this.supportTicketService.getSupportsCategoriesSelectValue(value!),
        ),
      )
      .subscribe((resp) => {
        this.supportCategories.set(resp);
      });
  }

  refetchTicketDetails() {
    this.supportTicketService
      .getTicketDetailsAsAssignee(this.ticketId!)
      .subscribe({
        next: (res) => {
          this.ticketDetails.set(res);
          this.patchForm();
        },
        error: () => {
          this.toastr.error(
            this.translocoService.translate('global.wrong_msg.title'),
          );
        },
      });
  }

  onCloseModal() {
    this.closeModal?.();
  }

  onSave() {
    this.supportTicketService
      .reassignTicket(this.ticketId, this.getRestMap())
      .subscribe({
        next: () => {
          this.afterReassigned?.();
          this.closeModal();
          this.toastr.success(
            this.translate('support_ticket.ticket_successfully_assigned.txt'),
          );
        },
        error: (errResp) => {
          this.toastr.showBackendError(errResp);
        },
      });
  }

  joinRoleNames(roles: Personnel['roles']): string {
    return roles.map((role) => role.displayName).join(', ');
  }
  //#endregion

  //#region Private Methods
  private patchForm() {
    this.form.patchValue({
      supportTypeId: this.ticketDetails()?.supportTypeId,
      supportCategoryId: this.ticketDetails()?.supportCategoryId,
    });
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  private getRestMap(): IReassignTicketPayload {
    const { personnels } = this.form.getRawValue();
    return {
      supportTypeId: this.form.controls.supportTypeId.value,
      supportCategoryId: this.form.controls.supportCategoryId.value,
      personnelIds: personnels,
    };
  }

  private loadMorePersonnel(ev: InfiniteScrollCustomEvent) {
    this.personnelService.getPersonnelsList(
      this.selectedSchool()?.id!,
      {
        pageNumber:
          this.personnelService.personnelsPagination()?.pageNumber! + 1,
      },
      true,
      true,
      ev,
    );
  }

  private searchPersonnel(value: string) {
    this.personnelService.updatePersonnelsListSearchText(value || undefined);
    this.personnelService.getPersonnelsList(
      this.selectedSchool()?.id!,
      {},
      false,
      true,
    );
  }
  //#endregion
}
