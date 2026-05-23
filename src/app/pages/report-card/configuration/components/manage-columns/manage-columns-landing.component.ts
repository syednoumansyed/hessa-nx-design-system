import { Component, computed, inject, input, OnInit } from '@angular/core';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { IonButton } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { createColumnModal } from './add-column/column-form.modal';
import { ReportCardColumnListComponent } from './report-card-column-list/report-card-column-list.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { isMobile } from '@shared/utils/platform';
import { ManageReportCardContextService } from '../../services/manage-report-card-context.service';
import { ReportCardDetail } from '../../data-access/report-card-configuration.interface';

@Component({
  selector: 'app-manage-columns-landing',
  templateUrl: './manage-columns-landing.component.html',
  standalone: true,
  imports: [
    IonButton,
    HesButtonModule,
    HessaBtnDirective,
    TranslocoDirective,
    ReportCardColumnListComponent,
    FontAwesomeModule,
  ],
})
export class ManageColumnsLandingComponent implements OnInit {
  // #region Inputs
  reportCard = input<ReportCardDetail | null>();
  // #endregion

  // #region Injector
  private readonly addColumnModal = createColumnModal();
  private readonly contextService = inject(ManageReportCardContextService);
  // #endregion

  // #region Protected Properties
  protected readonly isView = this.contextService.isView;
  protected readonly isEdit = this.contextService.isEdit;
  protected readonly isCreate = this.contextService.isCreate;
  protected readonly addIcon = faPlus;
  protected readonly isMobile = isMobile();
  protected readonly columns = computed(() => {
    return this.reportCard()?.columns ?? [];
  });
  protected readonly hasColumns = computed(() => {
    return (this.reportCard()?.sortedColumns ?? []).length > 0;
  });

  // #endregion
  constructor() {}

  ngOnInit() {}

  faPlus = faPlus;

  onAddNewColumn() {
    this.addColumnModal({
      reportCard: this.reportCard()!,
      column: null,
      existingColumn: null,
    });
  }
}
