import { BaseReportComponent } from './components/report-base.component';
import { SmsClassLevelReportComponent } from './components/sms-class-level-report/sms-class-level-report.component';
import { ReportType } from './reports';

export const ComponentLevelReport = [ReportType.SMS_AT_CLASS_LEVEL] as const;

export type ComponentBasedReport = (typeof ComponentLevelReport)[number];

export const ReportComponentRegistry: Record<
  ComponentBasedReport,
  new (...args: any[]) => BaseReportComponent
> = {
  [ReportType.SMS_AT_CLASS_LEVEL]: SmsClassLevelReportComponent,
};

export function getComponentForReport(reportType: ReportType): any | null {
  return (ComponentLevelReport as readonly ReportType[]).includes(reportType)
    ? ReportComponentRegistry[reportType as ComponentBasedReport] ?? null
    : null;
}
