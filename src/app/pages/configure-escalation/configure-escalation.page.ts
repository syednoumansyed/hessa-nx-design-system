import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { NoEscalationComponent } from './components/no-escalation/no-escalation.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { ConfigureEscalationService } from './data-access/configure-escalation.service';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { isMobile } from '@shared/utils/platform';
import { EscalationSkeletonComponent } from './components/escalation-skeleton/escalation-skeleton.component';
import { Router } from '@angular/router';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '../../shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EscalationLevel,
  EscalationPersonnel,
  EscalationTypeDetails,
} from './data-access/configure-escalation.interface';

@Component({
  selector: 'app-configure-escalation',
  templateUrl: './configure-escalation.page.html',
  styleUrls: ['./configure-escalation.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    TranslocoDirective,
    RbacDirective,
    NoEscalationComponent,
    HesIconComponent,
    HesButtonModule,
    EscalationSkeletonComponent,
    NoSelectedScopeCardComponent,
  ],
})
export class ConfigureEscalationPage implements OnInit {
  private readonly translocoService = inject(TranslocoService);
  private readonly router = inject(Router);
  private schoolScopeService = inject(SchoolStructureScopeService);
  private configureEscalationService = inject(ConfigureEscalationService);

  readonly viewEscalationDetailPermission =
    RESOURCE_PERMISSION.supportTicket.viewEscalationDetails;
  selectedSchoolId = this.schoolScopeService.selectedSchoolId;
  selectedSchool = computed(() => {
    if (this.schoolScopeService.selectedSchoolId())
      return this.schoolScopeService.selectedSchoolStructureItem();
    else return null;
  });
  escalationTypesDetail = signal<EscalationTypeDetails[]>([]);
  isLoading = signal<boolean>(false);
  isMobile = isMobile();
  readonly requiredScopes: Array<HesScope> = ['school'];

  constructor() {
    toObservable(this.schoolScopeService.selectedSchoolId)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.fetchSchoolEscalationConfig();
      });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.fetchSchoolEscalationConfig();
  }

  private fetchSchoolEscalationConfig() {
    if (this.selectedSchoolId()) {
      this.isLoading.set(true);
      this.configureEscalationService
        .getSchoolEscalations(this.selectedSchoolId()!)
        .subscribe({
          next: (resp) => {
            this.escalationTypesDetail.set(resp);
            this.isLoading.set(false);
          },
          error: () => {
            this.escalationTypesDetail.set([]);
            this.isLoading.set(false);
          },
        });
    }
  }

  navigateToTypeDetailPage(typeId: number) {
    this.router.navigate([
      'settings/configure-escalation',
      typeId,
      'escalation-levels',
    ]);
  }

  getDefaultPersonnelList(escalation: EscalationTypeDetails) {
    const noneTxt = this.translate('global.none.txt');
    return (
      escalation.escalations
        .find((escalation: EscalationLevel) => escalation.levelNumber === 0)
        ?.personnels.map(
          (personnel: EscalationPersonnel) => personnel.displayName,
        )
        .join(', ') || noneTxt
    );
  }

  getLevelsCount(escalation: EscalationTypeDetails) {
    const noneTxt = this.translate('global.none.txt');
    return escalation.escalations.length - 1 || noneTxt;
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
