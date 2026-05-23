import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { isMobile } from '@shared/utils/platform';
import { ConfigureEscalationService } from '@pages/configure-escalation/data-access/configure-escalation.service';
import { NoEscalationComponent } from '@pages/configure-escalation/components/no-escalation/no-escalation.component';
import { EscalationSkeletonComponent } from '@pages/configure-escalation/components/escalation-skeleton/escalation-skeleton.component';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { ConfigureEscalationDialogService } from '@pages/configure-escalation/configure-escalation-dialog.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '../../../../shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EscalationLevel,
  EscalationPersonnel,
  EscalationTypeDetails,
} from '@pages/configure-escalation/data-access/configure-escalation.interface';

@Component({
  selector: 'app-configure-escalation-type',
  templateUrl: './configure-escalation-type.page.html',
  styleUrls: ['./configure-escalation-type.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    TranslocoDirective,
    RbacDirective,
    NoEscalationComponent,
    HesIconComponent,
    DsButtonComponent,
    EscalationSkeletonComponent,
    NoSelectedScopeCardComponent,
  ],
})
export class ConfigureEscalationTypePage implements OnInit, OnDestroy {
  private readonly sub = new Subscription();
  readonly requiredScopes: Array<HesScope> = ['school'];
  readonly addEscalationPermission =
    RESOURCE_PERMISSION.supportTicket.createEscalation;
  readonly updateEscalationPermission =
    RESOURCE_PERMISSION.supportTicket.updateEscalation;
  readonly deleteEscalationPermission =
    RESOURCE_PERMISSION.supportTicket.deleteEscalation;

  private readonly translocoService = inject(TranslocoService);
  private schoolScopeService = inject(SchoolStructureScopeService);
  private configureEscalationService = inject(ConfigureEscalationService);
  private configureEscalationDialogService = inject(
    ConfigureEscalationDialogService,
  );

  selectedSchoolId = this.schoolScopeService.selectedSchoolId;
  selectedSchool = computed(() => {
    if (this.schoolScopeService.selectedSchoolId())
      return this.schoolScopeService.selectedSchoolStructureItem();
    else return null;
  });
  escalationType = signal<EscalationTypeDetails | undefined>(undefined);
  isLoading = signal<boolean>(false);
  isMobile = isMobile();
  faPlus = faPlus;

  /**
   * The ID of the student.
   * @type {string | null}
   */
  @Input() id: string;

  constructor() {
    toObservable(this.selectedSchoolId)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.fetchSchoolEscalations();
      });
  }

  ngOnInit() {
    this.sub.add(
      this.configureEscalationDialogService.onSuccessEscalationLevel$.subscribe(
        () => {
          this.fetchSchoolEscalations();
        },
      ),
    );
  }

  ionViewWillEnter() {
    this.fetchSchoolEscalations();
  }

  fetchSchoolEscalations() {
    if (this.selectedSchoolId()) {
      this.isLoading.set(true);
      this.configureEscalationService
        .getSchoolEscalations(
          this.schoolScopeService.selectedSchoolStructureItem()!.id,
        )
        .subscribe({
          next: (resp) => {
            this.isLoading.set(false);
            const result = resp.find(
              (escalation: EscalationTypeDetails) =>
                +escalation.supportType.id === +this.id,
            );
            this.escalationType.set(result);
          },
          error: () => {
            this.isLoading.set(false);
            this.escalationType.set(undefined);
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  handleUpdateEscalationLevel(escalationLevel: EscalationLevel) {
    this.configureEscalationDialogService.showEscalationLevelDialog(
      this.escalationType(),
      escalationLevel,
      true,
    );
  }

  handleAddEscalationLevel() {
    this.configureEscalationDialogService.showEscalationLevelDialog(
      this.escalationType(),
    );
  }

  handleDeleteEscalationLevel(escalationId: number) {
    this.configureEscalationDialogService.deleteEscalationLevelDialog(
      escalationId,
      this.selectedSchool()?.id as number,
      this.escalationType()?.supportType.id as number,
    );
  }

  getPersonnelList(level: EscalationLevel) {
    const noneTxt = this.translate('global.none.txt');
    return (
      level.personnels
        .map((personnel: EscalationPersonnel) => personnel.displayName)
        .join(', ') || noneTxt
    );
  }

  determineLevelTxt(level: EscalationLevel) {
    const defaultTxt = this.translate(
      'support_ticket.default_escalation_level.title',
    );
    if (level.levelNumber === 0) {
      return defaultTxt;
    }
    return `${this.translate('support_ticket.escalation_level.title')} ${level.levelNumber}`;
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
