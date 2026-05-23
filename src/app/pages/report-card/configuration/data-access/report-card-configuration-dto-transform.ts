import {
  ManageReportCardListDTO,
  ReportCardColumnDetailDTO,
  ReportCardDetailDTO,
  ReportCardSubjectDTO,
  SortedColumnDTO,
} from './report-card-configuration.model';
import {
  ManageReportCardList,
  ReportCardColumnDetail,
  ReportCardDetail,
  ReportCardSubject,
  SortedColumn,
} from './report-card-configuration.interface';
import { ensureArray } from '@shared/utils/array.util';
import { getLocalizedName } from '@shared/utils/localization.util';
import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { ReportCardPreviewDTO } from './report-card-preview.dto';
import { ReportCardPreview } from './report-card-preview.interface';

export const REPORT_CARD_CONFIGURATION_MAP_FROM_DTO = new (class {
  subjects(dto: ReportCardSubjectDTO[]): ReportCardSubject[] {
    return ensureArray(dto).map((d) => ({
      id: d.id,
      displayName: getLocalizedName(d),
      displayedValue: getLocalizedName(d),
      maxMarks: d.maxMarks,
      value: d.id,
      levelIds: ensureArray(d.levels).map((level) => level.id),
      levelDisplayNames: ensureArray(d.levels)
        .map((level) => getLocalizedName(level))
        .join(', '),
    }));
  }

  manageReportCardList(dto: ManageReportCardListDTO[]): ManageReportCardList[] {
    return ensureArray(dto).map((d) => ({
      id: d.id,
      title: d.title,
      levels: COMMON_MAP_FROM_DTO.displayNameIdentifiables(
        ensureArray(d.levels),
      ),
      semesters: ensureArray(d.semesters),
      academicYears: ensureArray(d.academicYears),
      schools: COMMON_MAP_FROM_DTO.displayNameIdentifiables(
        ensureArray(d.schools),
      ),
      startDate: d.startDate,
      endDate: d.endDate,
      semesterId: d.semesterId,
      academicYearId: d.academicYearId,
    }));
  }

  reportCardDetail(dto: ReportCardDetailDTO): ReportCardDetail {
    const semester =
      ensureArray(dto.semesters).length === 1 ? dto.semesters?.[0] : null;
    const schoolId = dto.school.id;

    return {
      id: dto.id,
      title: dto.title,
      academicYearId: dto.academicYearId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      levels: COMMON_MAP_FROM_DTO.displayNameIdentifiables(
        ensureArray(dto.levels),
      ),
      semesters: ensureArray(dto.semesters),
      academicYear: dto.academicYear,
      displaySchool: getLocalizedName(dto.school),
      schoolId: schoolId!,
      existingColumns: ensureArray(dto.existingColumns),
      columns: ensureArray(dto.columns).map((col) =>
        this.reportCardColumns(col),
      ),
      sortedColumns: ensureArray(dto.sortedColumns).map((col) =>
        this.sortedColumn(col),
      ),
      semester: semester ? semester : null,
      semesterId: semester ? semester.id : null,
    };
  }

  reportCardColumns(dto: ReportCardColumnDetailDTO): ReportCardColumnDetail {
    return {
      id: dto.id,
      title: dto.title,
      scaleTo: dto.scaleTo,
      maxMarks: dto.maxMarks,
      subjects: this.subjects(dto.subjects),
      aggregate: dto.sumAggregate,
      columnType: dto.columnType,
      maxEntries: dto.maxEntries,
      minEntries: dto.minEntries,
      functionType: dto.functionType,
      sumAggregate: dto.sumAggregate,
      selectedColumns: ensureArray(dto.selectedColumns),
    };
  }

  sortedColumn(dto: SortedColumnDTO): SortedColumn {
    return {
      id: dto.id,
      title: dto.title,
      scaleTo: dto.scaleTo,
      maxMarks: dto.maxMarks,
      sequence: dto.sequence,
      subjects: this.subjects(ensureArray(dto.subjects)),
      columnType: dto.columnType,
      maxEntries: dto.maxEntries,
      minEntries: dto.minEntries,
      functionType: dto.functionType,
      sumAggregate: dto.sumAggregate,
      selectedColumns: ensureArray(dto.selectedColumns),
      isExistingColumn: dto.isExistingColumn,
      createdAt: dto.createdAt,
      isCalculatePercentage: dto.isCalculatePercentage,
      isCalculateGpa: dto.isCalculateGpa,
      isHide: dto.isHide,
    };
  }

  reportCardPreview(dto: ReportCardPreviewDTO): ReportCardPreview {
    return {
      data: dto.data,
      table: {
        ...dto.table,
        columns: dto.table.columns.map((col) => ({
          id: col.id,
          title: col.title,
          data: col.data ?? null,
          rows: col.rows.map((row) => ({
            id: row.id,
            displayTitle: getLocalizedName({
              enName: row.titleEn,
              arName: row.title,
            }),
          })),
        })),
      },
    };
  }
})();
