import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, OnInit } from '@angular/core';
import {
  ReportCardColumnDetailDTO,
  ReportCardExistingColumnDTO,
} from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import {
  ReportCardCalculatedFunctionEnum,
  ReportCardHorizontalFunctionEnum,
} from '../../../../data-access/report-card-configuration.enum';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'app-report-card-function-chip',
  templateUrl: './report-card-function-chip.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
})
export class ReportCardFunctionChipComponent {
  // #region Input Region
  column = input<ReportCardColumnDetailDTO | null>();
  exsitingColumn = input<ReportCardExistingColumnDTO | null>();
  // #endregion

  // #region injectable
  private readonly translate = inject(HesTranslateService);
  // #endregion

  // #region Protected Properties
  protected isMaxMarks = computed(() => !!this.column()?.maxMarks);
  protected isFunctionType = computed(() => !!this.column()?.functionType);
  // #endregion

  // #region Protected Methods
  protected getClassMap(): string {
    switch (this.column()?.functionType) {
      case ReportCardCalculatedFunctionEnum.SUM:
      case ReportCardHorizontalFunctionEnum.SUM:
        return 'border-[#F4D7BE] bg-[#FBF1E8]';
      case ReportCardCalculatedFunctionEnum.AVERAGE:
      case ReportCardHorizontalFunctionEnum.AVERAGE:
        return 'border-[#BEC1F4] bg-[#E8E9FB]';
      case ReportCardCalculatedFunctionEnum.WEIGHTED_AVERAGE:
        return 'border-[#BEEAF4] bg-[#E8F7FB]';
      case ReportCardHorizontalFunctionEnum.LETTER_GRADE:
        return 'border-[#F4BED9] bg-[#FBE8F1]';
      case ReportCardHorizontalFunctionEnum.NUMERIC_GRADE:
        return 'border-[#F4D2BE] bg-[#FBEFE8]';
      case ReportCardHorizontalFunctionEnum.NUMERIC_GRADE_AVERAGE:
        return 'border-[#DEBEF4] bg-[#F3E8FB]';
      case ReportCardHorizontalFunctionEnum.CREDIT_HOUR:
        return 'border-[#F2F4BE] bg-[#FAFBE8]';
      case ReportCardHorizontalFunctionEnum.SCALE:
        return 'border-[#D0F4BE] bg-[#EEFBE8]';
      case ReportCardHorizontalFunctionEnum.GRADE_POINT:
        return 'border-[#BEDEF4] bg-[#E8F3FB]';
      default:
        return '';
    }
  }

  protected getFunctionType(): string {
    switch (this.column()?.functionType) {
      case ReportCardCalculatedFunctionEnum.SUM:
      case ReportCardHorizontalFunctionEnum.SUM:
        return this.translate.t('grade_management.sum.dropdown');
      case ReportCardCalculatedFunctionEnum.AVERAGE:
      case ReportCardHorizontalFunctionEnum.AVERAGE:
        return this.translate.t('grade_management.average.dropdown');
      case ReportCardCalculatedFunctionEnum.WEIGHTED_AVERAGE:
        return this.translate.t('grade_management.weighted_average.dropdown');
      case ReportCardHorizontalFunctionEnum.LETTER_GRADE:
        return this.translate.t(
          'function_settings.selection_section.letter_grade_option',
        );
      case ReportCardHorizontalFunctionEnum.NUMERIC_GRADE:
        return this.translate.t('grade_management.numeric_grade.dropdown');
      case ReportCardHorizontalFunctionEnum.NUMERIC_GRADE_AVERAGE:
        return this.translate.t(
          'grade_management.numeric_grade_average.dropdown',
        );
      case ReportCardHorizontalFunctionEnum.CREDIT_HOUR:
        return this.translate.t('grade_management.credit_hours.dropdown');
      case ReportCardHorizontalFunctionEnum.SCALE:
        return this.translate.t('grade_management.scale.dropdown');
      case ReportCardHorizontalFunctionEnum.GRADE_POINT:
        return this.translate.t('grade_management.grade_point.dropdown');
      default:
        return '';
    }
  }
  // #endregion
}
