import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { ReportType, ReportTypePermission } from './reports';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import { NoDataBtnInterface } from '@shared/components/no-data-card/no-data-card.component';
import { HesButtonModule } from '../../ui-kit/hes-button/hes-button.module';
import { CommonModule } from '@angular/common';
import { ReportsService } from './reports.service';
import {
  ReportsConfigService,
  ReportControlConfig,
} from './reports-config.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { of, Subscription, switchMap } from 'rxjs';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { ReportFilterComponent } from './components/report-filter/report-filter.component';
import { SmsClassLevelReportComponent } from './components/sms-class-level-report/sms-class-level-report.component';
import { ReportExportContextService } from './service/report-export-context.service';
import { ReportHistoryComponent } from './components/report-history/report-history.component';
import { ComponentBasedReport, ComponentLevelReport } from './report.constant';
@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    TranslocoDirective,
    FormControlGeneratorComponent,
    ReactiveFormsModule,
    HesButtonModule,
    CommonModule,
    IonSpinner,
    ReportFilterComponent,
    SmsClassLevelReportComponent,
    ReportHistoryComponent,
  ],
  providers: [EnumLangPipe, ReportsService, ReportsConfigService],
})
export class ReportsPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private transloco = inject(TranslocoService);
  private reportsConfigService = inject(ReportsConfigService);
  private toastr = inject(HesToasterService);
  private rbac = inject(RoleBaseAccessControlService);
  readonly reportExportContextService = inject(ReportExportContextService);
  readonly reportType = signal<ReportType | null>(null);
  readonly ReportTypeEnum = ReportType;
  readonly reportFiltersConfig = signal<ReportControlConfig[] | null>(null);
  readonly isLoading = signal<boolean>(false);

  // #region Angular reference
  reportHistorycompRef = viewChild(ReportHistoryComponent);
  // #endregion

  readonly reportForm = this.fb.group({
    reportType: new FormControl<ReportType | null>(null),
  });
  readonly reportTypeConfig: IControl = {
    label: this.transloco.translate('reports.select_report.title'),
    type: 'searchable-select',
    placeholder: this.transloco.translate('reports.select_report.placeholder'),
    formControlName: 'reportType',
    selectValues: Object.values(ReportType)
      .filter((v) => {
        return this.rbac.hasPermission(ReportTypePermission[v]);
      })
      .map((value) => ({
        value: value as string,
        displayedValue: this.transloco.translate(
          'reports.' + value.toLowerCase() + '.title',
        ),
      })),
    required: false,
  };

  filterForm: FormGroup | null = null;
  noDataBtn: NoDataBtnInterface = {
    label: this.transloco.translate('global.export_data.btn'),
    onAction: () => {},
    disabled: true,
  };

  subscription: Subscription;

  constructor() {}

  ngOnInit() {
    this.subscription = this.reportForm.controls.reportType.valueChanges
      .pipe(
        switchMap((value) => {
          this.reportType.set(value);
          if (this.isComponentBaseType()) {
            this.filterForm = null;
            return of(null);
          }
          if (value) {
            this.reportsConfigService.setStrategy(value);
            return this.reportsConfigService.getFilterConfig();
          }
          return of(null);
        }),
      )
      .subscribe((value) => {
        if (value) {
          this.reportFiltersConfig.set(value);
          this.filterForm = this.reportsConfigService.getForm();
        }
      });
  }

  generateReport() {
    this.isLoading.set(true);
    let obs$;
    if (this.isComponentBaseType()) {
      obs$ = this.reportsConfigService.exportReport(
        this.reportExportContextService.formValue,
        this.reportExportContextService.apiRoute,
        this.reportExportContextService.exportReport,
      );
    } else {
      obs$ = this.reportsConfigService.exportReport();
    }
    obs$?.subscribe({
      next: () => {
        this.toastr.success(
          this.transloco.translate(
            'reports.report_generation_in_progress.title',
          ),
        );
        this.reportForm.controls.reportType.setValue(null);
        this.isLoading.set(false);
        this.reportHistorycompRef()?.reload();
      },
      error: (error) => {
        this.toastr.showBackendError(error);
        this.isLoading.set(false);
      },
    });
  }

  clearFilterForm() {
    this.filterForm?.reset();
    this.reportExportContextService.resetForm();
  }

  private isComponentBaseType() {
    const reportType = this.reportType();
    return (
      reportType &&
      ComponentLevelReport.includes(reportType as ComponentBasedReport)
    );
  }

  ionViewWillEnter() {
    this.reportHistorycompRef()?.onResumePolling();
  }

  ionViewWillLeave() {
    this.reportHistorycompRef()?.onPausePolling();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
