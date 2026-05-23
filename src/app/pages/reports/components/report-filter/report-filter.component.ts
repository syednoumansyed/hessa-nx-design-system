import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportControlConfig } from '@pages/reports/reports-config.service';
import { FormControlGeneratorComponent } from '@shared/components/form-control-generator/form-control-generator.component';

@Component({
  selector: 'app-report-filter',
  templateUrl: './report-filter.component.html',
  standalone: true,
  imports: [CommonModule, FormControlGeneratorComponent, ReactiveFormsModule],
})
export class ReportFilterComponent implements OnInit {
  config = input<ReportControlConfig[] | null>(null);
  form = input<FormGroup | null>(null);

  constructor() {}

  ngOnInit() {}
}
