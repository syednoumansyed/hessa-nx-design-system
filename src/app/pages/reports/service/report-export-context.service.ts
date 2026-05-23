// report-export.service.ts
import { Injectable } from '@angular/core';
import { ReportExporter } from '../report.interface';
import { FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class ReportExportContextService {
  private currentExporter: ReportExporter | null = null;

  registerExporter(exporter: ReportExporter): void {
    this.currentExporter = exporter;
  }

  unregisterExporter(): void {
    this.currentExporter = null;
  }

  getExporter(): ReportExporter | null {
    return this.currentExporter;
  }

  resetForm() {
    if (this.currentExporter) {
      this.currentExporter.form.reset();
    }
  }

  get isExporterRegistered(): boolean {
    return this.currentExporter !== null;
  }

  get exportReport(): Record<string, any> {
    return this.currentExporter?.exportReport() || {};
  }
  get apiRoute(): string {
    return this.currentExporter?.getApiRoute() || '';
  }
  get formValue(): Record<string, any> {
    return this.currentExporter?.form.value || {};
  }

  get invalidForm(): boolean {
    return this.currentExporter?.form.invalid || false;
  }
}
