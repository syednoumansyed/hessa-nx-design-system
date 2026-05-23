import { OnInit, OnDestroy, inject, Component, Signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';
import { ReportExporter } from '../report.interface';
import { ReportExportContextService } from '../service/report-export-context.service';
import { createFormFromReportConfig } from '@shared/utils/generate-form-from-config.util';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesSubscription } from '@shared/utils/hes-subscription.util';
@Component({
  selector: '',
  template: '',
})
export abstract class BaseReportComponent
  implements ReportExporter, OnInit, OnDestroy
{
  protected fb = inject(FormBuilder);
  protected exportContext = inject(ReportExportContextService);
  protected translate = inject(HesTranslateService);
  protected readonly subscription = new HesSubscription();

  form: FormGroup;
  abstract getApiRoute(): string;

  abstract formConfig: Signal<IControl[]>;

  constructor() {
    this.exportContext.registerExporter(this);
  }

  ngOnInit() {
    if (this.formConfig()) {
      this.initializeForm();
    }
  }

  protected initializeForm() {
    this.form = this.createFormControls(this.formConfig!());
  }

  private createFormControls(config: IControl[]) {
    return createFormFromReportConfig(config, this.fb);
  }

  ngOnDestroy() {
    this.exportContext.unregisterExporter();
    this.form.reset();
    this.subscription.unsubscribe();
  }

  abstract exportReport(): any;
}
