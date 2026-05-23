import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Input,
  OnInit,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { ReportItemDTO } from '@pages/reports/reports';
import {
  ReportControlConfig,
  ReportsConfigService,
} from '@pages/reports/reports-config.service';
import { ReportsService } from '@pages/reports/reports.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { ReportComponentFactoryService } from '@pages/reports/service/report-component-factory.service';
import { BaseReportComponent } from '../report-base.component';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';

@Component({
  selector: 'app-report-history-details',
  templateUrl: './report-history-details.component.html',
  standalone: true,
  providers: [ReportsConfigService, ReportsService, HesDatePipe],
  imports: [CommonModule, TranslocoDirective, HesButtonModule],
})
export class ReportHistoryDetailsComponent implements OnInit {
  // #region Inputs and Outputs
  @Input() report: ReportItemDTO;
  @Input() closeModal: () => void = () => {};
  // #endregion

  // #region Protected Properties
  protected readonly faClose = faClose;
  protected readonly vm = signal<Record<string, string>>({});
  // #endregion
  // #region Injectables
  private readonly reportsService = inject(ReportsConfigService);
  private readonly translation = inject(HesTranslateService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly componentFactoryService = inject(
    ReportComponentFactoryService,
  );
  private readonly datePipe = inject(HesDatePipe);
  // #endregion

  constructor() {}

  ngOnInit() {
    const componentLevel =
      this.componentFactoryService.create<BaseReportComponent>(
        this.report.reportType,
        this.vcr,
      );
    if (componentLevel) {
      const config = componentLevel.instance.formConfig();
      this.buildVm(config);
      componentLevel.destroy();
    } else {
      this.reportsService.setStrategy(this.report.reportType);
      this.reportsService.getFilterConfig().subscribe({
        next: (config: ReportControlConfig[]) => {
          this.buildVm(config);
        },
      });
    }
  }

  // #region Private Methods

  private mapDateRange(dateFrom: string, dateTo: string) {
    if (!dateFrom || !dateTo) {
      return '';
    }
    return `${this.datePipe.transform(dateFrom)} - ${this.datePipe.transform(dateTo)}`;
  }

  private mapNameArrayObject(values: { name: string }[]) {
    return values?.map((value) => value.name).join(', ');
  }

  private mapEducationalPath(paths: string[]) {
    return paths?.map((path) => this.translation.enumT(path)).join(', ');
  }

  private mapEscalationLevels(levels: number[] = []) {
    const sortedLevels = [...levels].sort((a, b) => a - b);
    const mappedLevels = sortedLevels.map((level) =>
      level === 0
        ? this.translation.t('support_ticket.default_escalation_level.title')
        : level,
    );
    return mappedLevels.join(', ');
  }

  private buildVm(config: ReportControlConfig[]) {
    this.vm.set(
      config.reduce(
        (acc: Record<string, string>, item) => {
          const formControl = item.formControlName as string;
          const value = this.report.params[formControl];
          const label = item.label!;
          if (formControl === 'dateRange') {
            const { dateFrom, dateTo } = this.report.params;
            acc[label] = this.mapDateRange(dateFrom, dateTo);
          } else if (formControl === 'educationalPath') {
            acc[label] = this.mapEducationalPath(value);
          } else if (formControl === 'escalationLevels') {
            acc[label] = this.mapEscalationLevels(value);
          } else if (Array.isArray(value)) {
            acc[label] = this.mapNameArrayObject(value);
          } else {
            acc[label] = value ? value.toString() : '';
          }
          if (
            acc[label] === '' ||
            acc[label] === null ||
            acc[label] === undefined
          ) {
            delete acc[label];
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    );
  }
  // #endregion
}
