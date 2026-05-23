import {
  Injectable,
  ComponentRef,
  EnvironmentInjector,
  ViewContainerRef,
} from '@angular/core';
import { ReportType } from '../reports';
import { getComponentForReport } from '../report.constant';

@Injectable({ providedIn: 'root' })
export class ReportComponentFactoryService {
  constructor(private envInjector: EnvironmentInjector) {}

  create<T>(
    reportType: ReportType,
    vcr: ViewContainerRef,
  ): ComponentRef<T> | null {
    const component = getComponentForReport(reportType);
    if (!component) return null;

    return vcr.createComponent<T>(component, {
      environmentInjector: this.envInjector,
    });
  }
}
