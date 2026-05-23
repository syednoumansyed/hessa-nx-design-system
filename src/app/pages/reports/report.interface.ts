import { FormGroup } from '@angular/forms';
export interface ReportExporter {
  form: FormGroup;
  exportReport(): any;
  getApiRoute(): string;
}
