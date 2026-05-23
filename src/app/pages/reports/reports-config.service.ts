import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  EducationalPathEnum,
  SupportTicketStatus,
  DefaultRoles,
  EnDefaultRoles,
} from '@shared/enums';
import { StructureDepth } from '@shared/utils/school-structure';
import { ReportType } from './reports';
import { formatDate } from '@shared/utils/date';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { ReportsService } from './reports.service';
import {
  BehaviorSubject,
  map,
  Observable,
  of,
  take,
  Subject,
  switchMap,
  forkJoin,
  takeUntil,
  catchError,
} from 'rxjs';
import { createFormFromReportConfig } from '@shared/utils/generate-form-from-config.util';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';
import { AnnouncementUserQueryParams } from '@pages/announcements/data-access/post.dto';
import { getAnnouncementRestTarget } from '@pages/announcements/utils/announcement-rest-target-map.util';
import { TicketTypeService } from '@shared/services/ticket-type.service';

export interface ReportControlConfig extends IControl {
  hidden?: boolean;
}

abstract class ReportStrategy {
  //#region Abstract Members
  protected abstract getFilterConfig(): Observable<ReportControlConfig[]>;
  abstract exportReport(): {
    [key: string]: any;
  };
  abstract getApiRoute(): string;
  //#endregion

  //#region Protected Members & Constructor
  protected readonly destroy$ = new Subject<void>();
  protected form: FormGroup;

  constructor(
    protected fb: FormBuilder,
    protected translate: HesTranslateService,
    protected reportsService: ReportsService,
    protected ticketTypeService?: TicketTypeService,
  ) {
    this.initializeStrategy();
  }

  /**
   * Optionally override this in subclasses to subscribe to dynamic control changes.
   */
  protected initDynamicControlSubscriptions(): void {}

  /**
   * Generic function to update a control's configuration.
   * It updates the selectValues and hidden flag, and then enables/disables the control in the form.
   *
   * @param controlName The name of the control to update.
   * @param update An object with properties to update:
   *               - selectValues: (optional) new options for the control.
   *               - hidden: (optional) flag to hide (true) or show (false) the control.
   */
  protected updateControlConfig(
    controlName: string,
    update: Partial<Pick<ReportControlConfig, 'selectValues' | 'hidden'>>,
  ): void {
    const currentConfig = this.controlsConfigSource.value;
    if (!currentConfig || currentConfig.length === 0) {
      // Config not loaded yet, skip update
      return;
    }

    const controlIndex = currentConfig.findIndex(
      (control) => control.formControlName === controlName,
    );
    if (controlIndex > -1) {
      const control = currentConfig[controlIndex];

      // Create a new config array with the updated control
      const updatedControl = {
        ...control,
        ...(update.selectValues !== undefined && {
          selectValues: update.selectValues,
        }),
        ...(update.hidden !== undefined && { hidden: update.hidden }),
      };

      const newConfig = [
        ...currentConfig.slice(0, controlIndex),
        updatedControl,
        ...currentConfig.slice(controlIndex + 1),
      ];

      // Emit the updated config so any subscribers (e.g. UI generators) update.
      this.controlsConfigSource.next(newConfig);

      // Update the form control state: enable if not hidden, disable if hidden.
      const formControl = this.form?.get(controlName);
      if (formControl) {
        const isHidden =
          update.hidden !== undefined ? update.hidden : control.hidden;
        isHidden ? formControl.disable() : formControl.enable();
      }
    }
  }
  //#endregion

  //#region Private Members & Methods
  protected readonly controlsConfigSource = new BehaviorSubject<
    ReportControlConfig[]
  >([]);

  /**
   * Initializes the strategy by fetching the filter configuration,
   * setting up the form, and initializing dynamic subscriptions.
   */
  private initializeStrategy(): void {
    this.getFilterConfig()
      .pipe(take(1))
      .subscribe((controls) => {
        this.initForm(controls);
        this.setConfigControls(controls);
        this.initDynamicControlSubscriptions();
      });
  }

  private initForm(config: ReportControlConfig[]): void {
    this.form = createFormFromReportConfig(config, this.fb);
  }

  private setConfigControls(controls: ReportControlConfig[]): void {
    this.controlsConfigSource.next(controls);
  }
  //#endregion

  //#region Public Members & Methods
  public getFormConfig(): Observable<ReportControlConfig[]> {
    return this.controlsConfigSource.pipe(
      map((controls) =>
        controls.filter((control: ReportControlConfig) => !control.hidden),
      ),
    );
  }

  public getForm(): FormGroup {
    return this.form;
  }

  public getFormValue(): any {
    return this.form.value;
  }

  public destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //#endregion
}

class AttendanceSummarySchoolLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('global.date.title'),
        placeholder: this.translate.t('global.select_date.placeholder'),
        type: 'date-range',
        required: true,
        formControlName: 'dateRange',
      },
      {
        label: this.translate.t('school_structure.educational_path_req.label'),
        type: 'searchable-select',
        placeholder: this.translate.t(
          'global.select_educational_path.placholder',
        ),
        formControlName: 'educationalPath',
        selectValues: Object.values(EducationalPathEnum).map((value) => ({
          value: value,
          displayedValue: this.translate.enumT(value),
        })),
        required: true,
        isMultiple: true,
      },
      {
        label: this.translate.t('global.school.title'),
        placeholder: this.translate.t('global.select_school.placeholder'),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        schoolStructureControlConfig: {
          depth: StructureDepth.SCHOOL,
        },
        isMultiple: true,
      },
    ]);
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
      dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
      educationalPath: formVal['educationalPath'],
    };
  }

  getApiRoute(): string {
    return 'attendance-report-at-school-level';
  }
}

class AttendanceSummaryLevelLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('global.date.title'),
        placeholder: this.translate.t('global.select_date.placeholder'),
        type: 'date-range',
        required: true,
        formControlName: 'dateRange',
        datePickerConfig: {
          maxLength: { year: 1, month: 0, day: 0 },
        },
      },
      {
        label: this.translate.t('global.schools_levels.title'),
        placeholder: this.translate.t('global.select_school_level.placeholder'),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        schoolStructureControlConfig: {
          depth: StructureDepth.LEVEL,
        },
        isMultiple: true,
      },
    ]);
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
      dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
    };
  }

  getApiRoute(): string {
    return 'daily-attendance-report-at-level-level';
  }
}

class AttendanceSummaryStudentLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('global.date.title'),
        placeholder: this.translate.t('global.select_date.placeholder'),
        type: 'date-range',
        required: true,
        formControlName: 'dateRange',
      },
      {
        label: this.translate.t('global.schools_levels_classes.title'),
        placeholder: this.translate.t(
          'global.schools_levels_classes.placeholder',
        ),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        schoolStructureControlConfig: {
          depth: StructureDepth.CLASS,
        },
        isMultiple: true,
      },
    ]);
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
      dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
    };
  }

  getApiRoute(): string {
    return 'attendance-report-at-student-level';
  }
}

class StudentAccountActivation extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('school_structure.educational_path_req.label'),
        type: 'searchable-select',
        placeholder: this.translate.t(
          'global.select_educational_path.placholder',
        ),
        formControlName: 'educationalPath',
        selectValues: Object.values(EducationalPathEnum).map((value) => ({
          value: value,
          displayedValue: this.translate.enumT(value),
        })),
        required: false,
        isMultiple: true,
      },
      {
        label: this.translate.t('global.school_structure.title'),
        placeholder: this.translate.t('global.school_structure.placeholder'),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        isMultiple: true,
      },
    ]);
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      ...(formVal['educationalPath']?.length && {
        educationalPath: formVal['educationalPath'],
      }),
    };
  }

  getApiRoute(): string {
    return 'activation-at-student-level';
  }
}

class GuardianAccountActivation extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('school_structure.educational_path_req.label'),
        type: 'searchable-select',
        placeholder: this.translate.t(
          'global.select_educational_path.placholder',
        ),
        formControlName: 'educationalPath',
        selectValues: Object.values(EducationalPathEnum).map((value) => ({
          value: value,
          displayedValue: this.translate.enumT(value),
        })),
        required: false,
        isMultiple: true,
      },
      {
        label: this.translate.t('global.school_structure.title'),
        placeholder: this.translate.t('global.school_structure.placeholder'),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        isMultiple: true,
      },
    ]);
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      ...(formVal['educationalPath']?.length && {
        educationalPath: formVal['educationalPath'],
      }),
    };
  }

  getApiRoute(): string {
    return 'activation-at-guardian-level';
  }
}

class EmployeeAccountActivation extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return this.reportsService.loadRoles().pipe(
      map((roles) => {
        return [
          {
            label: this.translate.t(
              'school_structure.educational_path_req.label',
            ),
            type: 'searchable-select',
            placeholder: this.translate.t(
              'global.select_educational_path.placholder',
            ),
            formControlName: 'educationalPath',
            selectValues: Object.values(EducationalPathEnum).map((value) => ({
              value: value,
              displayedValue: this.translate.enumT(value),
            })),
            required: false,
            isMultiple: true,
          },
          {
            label: this.translate.t('global.school_structure.title'),
            placeholder: this.translate.t(
              'global.school_structure.placeholder',
            ),
            type: 'school-structure',
            required: true,
            formControlName: 'targets',
            isMultiple: true,
          },
          {
            label: this.translate.t('global.role.title'),
            placeholder: this.translate.t('global.select_role.placeholder'),
            type: 'searchable-select',
            formControlName: 'targetRole',
            required: false,
            isMultiple: false,
            selectValues: roles,
          },
        ];
      }),
    );
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      ...(formVal['educationalPath']?.length && {
        educationalPath: formVal['educationalPath'],
      }),
      ...(formVal['targetRole'] && {
        roleId: formVal['targetRole'],
      }),
    };
  }

  getApiRoute(): string {
    return 'activation-at-employee-level';
  }
}

class UserAccountActivationSchoolLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return this.reportsService.loadRoles().pipe(
      map((roles) => {
        return [
          {
            label: this.translate.t(
              'school_structure.educational_path_req.label',
            ),
            type: 'searchable-select',
            placeholder: this.translate.t(
              'global.select_educational_path.placholder',
            ),
            formControlName: 'educationalPath',
            selectValues: Object.values(EducationalPathEnum).map((value) => ({
              value: value,
              displayedValue: this.translate.enumT(value),
            })),
            required: false,
            isMultiple: true,
          },
          {
            label: this.translate.t('global.school_structure.title'),
            placeholder: this.translate.t(
              'global.school_structure.placeholder',
            ),
            type: 'school-structure',
            required: true,
            formControlName: 'targets',
            isMultiple: true,
            schoolStructureControlConfig: {
              depth: StructureDepth.SCHOOL,
            },
          },
          {
            label: this.translate.t('global.role.title'),
            placeholder: this.translate.t('global.select_role.placeholder'),
            type: 'searchable-select',
            formControlName: 'targetRole',
            required: false,
            isMultiple: true,
            selectValues: roles,
          },
        ];
      }),
    );
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      ...(formVal['educationalPath']?.length && {
        educationalPath: formVal['educationalPath'],
      }),
      ...(formVal['targetRole']?.length && {
        roleIds: Array.isArray(formVal['targetRole'])
          ? formVal['targetRole']
          : [formVal['targetRole']],
      }),
    };
  }

  getApiRoute(): string {
    return 'users-activation-at-school-level';
  }
}

class InteractionWithContentAtSchoolLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('global.date.title'),
        placeholder: this.translate.t('global.select_date.placeholder'),
        type: 'date-range',
        required: false,
        formControlName: 'dateRange',
      },
      {
        label: this.translate.t('school_structure.educational_path_req.label'),
        type: 'searchable-select',
        placeholder: this.translate.t(
          'global.select_educational_path.placholder',
        ),
        formControlName: 'educationalPath',
        selectValues: Object.values(EducationalPathEnum).map((value) => ({
          value: value,
          displayedValue: this.translate.enumT(value),
        })),
        required: false,
        isMultiple: true,
      },
      {
        label: this.translate.t('global.school_structure.title'),
        placeholder: this.translate.t('global.school_structure.placeholder'),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        isMultiple: true,
        schoolStructureControlConfig: {
          depth: StructureDepth.SCHOOL,
        },
      },
    ]);
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      ...(formVal['dateRange'] && {
        dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
        dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
      }),
      ...(formVal['educationalPath']?.length && {
        educationalPath: formVal['educationalPath'],
      }),
    };
  }

  getApiRoute(): string {
    return 'interaction-with-content-at-school-level';
  }
}

class CommunicationAtSchoolLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('global.date.title'),
        placeholder: this.translate.t('global.select_date.placeholder'),
        type: 'date-range',
        required: false,
        formControlName: 'dateRange',
      },
      {
        label: this.translate.t('school_structure.educational_path_req.label'),
        type: 'searchable-select',
        placeholder: this.translate.t(
          'global.select_educational_path.placholder',
        ),
        formControlName: 'educationalPath',
        selectValues: Object.values(EducationalPathEnum).map((value) => ({
          value: value,
          displayedValue: this.translate.enumT(value),
        })),
        required: false,
        isMultiple: true,
      },
      {
        label: this.translate.t('global.school_structure.title'),
        placeholder: this.translate.t('global.school_structure.placeholder'),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        isMultiple: true,
        schoolStructureControlConfig: {
          depth: StructureDepth.SCHOOL,
        },
      },
    ]);
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      ...(formVal['dateRange'] && {
        dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
        dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
      }),
      ...(formVal['educationalPath']?.length && {
        educationalPath: formVal['educationalPath'],
      }),
    };
  }

  getApiRoute(): string {
    return 'communications-at-school-level';
  }
}

class InteractionAndCommunicationAtTeacherLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('global.date.title'),
        placeholder: this.translate.t('global.select_date.placeholder'),
        type: 'date-range',
        required: false,
        formControlName: 'dateRange',
      },
      {
        label: this.translate.t('school_structure.educational_path_req.label'),
        type: 'searchable-select',
        placeholder: this.translate.t(
          'global.select_educational_path.placholder',
        ),
        formControlName: 'educationalPath',
        selectValues: Object.values(EducationalPathEnum).map((value) => ({
          value: value,
          displayedValue: this.translate.enumT(value),
        })),
        required: false,
        isMultiple: true,
      },
      {
        label: this.translate.t('global.school_structure.title'),
        placeholder: this.translate.t('global.school_structure.placeholder'),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        isMultiple: true,
        schoolStructureControlConfig: {
          depth: StructureDepth.SCHOOL,
        },
      },
    ]);
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      ...(formVal['dateRange'] && {
        dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
        dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
      }),
      ...(formVal['educationalPath']?.length && {
        educationalPath: formVal['educationalPath'],
      }),
    };
  }

  getApiRoute(): string {
    return 'interaction-and-communications-at-teacher-level';
  }
}

class InteractionWithContentAtStaffLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return this.reportsService.loadRoles().pipe(
      map((roles) => {
        const staffRoles = roles.filter(
          (role) =>
            role.displayedValue !== DefaultRoles.STUDENT &&
            role.displayedValue !== DefaultRoles.GUARDIAN &&
            role.displayedValue !== DefaultRoles.TEACHER &&
            role.displayedValue !== EnDefaultRoles.STUDENT &&
            role.displayedValue !== EnDefaultRoles.GUARDIAN &&
            role.displayedValue !== EnDefaultRoles.TEACHER,
        );
        return [
          {
            label: this.translate.t('global.school_structure.title'),
            placeholder: this.translate.t(
              'global.school_structure.placeholder',
            ),
            type: 'school-structure',
            required: true,
            formControlName: 'targets',
            isMultiple: true,
          },
          {
            label: this.translate.t('global.date.title'),
            placeholder: this.translate.t('global.select_date.placeholder'),
            type: 'date-range',
            required: false,
            formControlName: 'dateRange',
          },
          {
            label: this.translate.t('global.role.title'),
            placeholder: this.translate.t('global.select_role.placeholder'),
            type: 'searchable-select',
            formControlName: 'roleIds',
            required: false,
            isMultiple: true,
            selectValues: staffRoles,
          },
          {
            label: this.translate.t(
              'school_structure.educational_path_req.label',
            ),
            type: 'searchable-select',
            placeholder: this.translate.t(
              'global.select_educational_path.placholder',
            ),
            formControlName: 'educationalPath',
            selectValues: Object.values(EducationalPathEnum).map((value) => ({
              value: value,
              displayedValue: this.translate.enumT(value),
            })),
            required: false,
            isMultiple: true,
          },
        ];
      }),
    );
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      ...(formVal['dateRange'] && {
        dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
        dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
      }),
      ...(formVal['roleIds']?.length && {
        roleIds: formVal['roleIds'],
      }),
      ...(formVal['educationalPath']?.length && {
        educationalPath: formVal['educationalPath'],
      }),
    };
  }

  getApiRoute(): string {
    return 'interaction-and-communication-at-staff-level';
  }
}

class SupportTickesAtSchoolLevel extends ReportStrategy {
  constructor(
    protected override fb: FormBuilder,
    protected override translate: HesTranslateService,
    protected override reportsService: ReportsService,
    protected override ticketTypeService: TicketTypeService,
  ) {
    super(fb, translate, reportsService, ticketTypeService);
  }

  protected override initDynamicControlSubscriptions() {
    // Subscribe to targets changes
    this.form
      .get('targets')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        switchMap((resp) => {
          if (!resp.length) {
            return of({
              assignees: [],
              initiators: [],
            });
          }
          const mappedTargets = resp.map(
            (target: {
              id: number;
              type: SchoolStructureEntityType;
              name: string;
            }) => {
              const { id, ...targetWithoutId } = target;
              return {
                ...targetWithoutId,
                type: target.type === 'sub-company' ? 'company' : target.type,
                entityId: target.id,
              };
            },
          );
          return forkJoin({
            assignees: this.reportsService.getTicketAssigneesByTarget({
              targets: mappedTargets,
            }),
            initiators: this.reportsService.getTicketInitiatorsByTarget({
              targets: mappedTargets,
            }),
          });
        }),
      )
      .subscribe(({ assignees, initiators }) => {
        this.updateControlConfig('assignees', {
          selectValues: assignees,
        });
        this.updateControlConfig('initiators', {
          selectValues: initiators,
        });
      });

    // Subscribe to support type changes
    this.form
      .get('supportType')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        switchMap((supportTypeId) => {
          // Reset the category when type changes
          const categoryControl = this.form.get('supportCategory');
          if (categoryControl) {
            categoryControl.reset();
            categoryControl.enable();
          }

          if (!supportTypeId) {
            return of([]);
          }

          return this.ticketTypeService!.fetchSubCategories({
            supportTypeId,
            paginated: false,
          }).pipe(
            map((response) => {
              return response.data.map((category) => ({
                value: category.id,
                displayedValue: category.displayName,
              }));
            }),
          );
        }),
      )
      .subscribe((categories) => {
        this.updateControlConfig('supportCategory', {
          selectValues: categories,
        });
      });
  }
  protected getFilterConfig(): Observable<ReportControlConfig[]> {
    return this.ticketTypeService!.fetchCategories({ order: 'asc' }).pipe(
      catchError(() => {
        return of([]);
      }),
      map((categories) => {
        return [
          {
            label: this.translate.t('global.date.title'),
            placeholder: this.translate.t('global.select_date.placeholder'),
            type: 'date-range',
            required: false,
            formControlName: 'dateRange',
          },
          {
            label: this.translate.t(
              'school_structure.educational_path_req.label',
            ),
            type: 'searchable-select',
            placeholder: this.translate.t(
              'global.select_educational_path.placholder',
            ),
            formControlName: 'educationalPath',
            selectValues: Object.values(EducationalPathEnum).map((value) => ({
              value: value,
              displayedValue: this.translate.enumT(value),
            })),
            required: false,
            isMultiple: true,
          },
          {
            label: this.translate.t('support_ticket.escalation_level.title'),
            type: 'searchable-select',
            placeholder: this.translate.t('report.select_escalation_level.txt'),
            formControlName: 'escalationLevels',
            selectValues: [
              {
                value: 0,
                displayedValue: this.translate.t(
                  'support_ticket.default_escalation_level.title',
                ),
              },
              {
                value: 1,
                displayedValue: '1',
              },
              {
                value: 2,
                displayedValue: '2',
              },
              {
                value: 3,
                displayedValue: '3',
              },
            ],
            required: false,
            isMultiple: true,
          },
          {
            label: this.translate.t('global.status.title'),
            type: 'searchable-select',
            placeholder: this.translate.t(
              'course_management.select_status.dropdown',
            ),
            formControlName: 'status',
            selectValues: [
              {
                value: SupportTicketStatus.REVIEW,
                displayedValue: this.translate.enumT(
                  SupportTicketStatus.REVIEW,
                ),
              },
              {
                value: SupportTicketStatus.RESOLVED,
                displayedValue: this.translate.enumT(
                  SupportTicketStatus.RESOLVED,
                ),
              },
            ],
            required: false,
            isMultiple: false,
          },
          {
            label: this.translate.t('report.support_type.title'),
            type: 'searchable-select',
            placeholder: this.translate.t(
              'support_ticket.select_support_type.placeholder',
            ),
            formControlName: 'supportType',
            selectValues: categories.map((category) => ({
              value: category.id,
              displayedValue: category.displayName,
            })),
            required: false,
            isMultiple: false,
          },
          {
            label: this.translate.t('report.support_category.title'),
            type: 'searchable-select',
            placeholder: this.translate.t(
              'support_ticket.select_support_category.placeholder',
            ),
            formControlName: 'supportCategory',
            selectValues: [],
            required: false,
            isMultiple: true,
          },
          {
            label: this.translate.t('global.school_structure.title'),
            placeholder: this.translate.t(
              'global.school_structure.placeholder',
            ),
            type: 'school-structure',
            required: true,
            formControlName: 'targets',
            isMultiple: true,
            schoolStructureControlConfig: {
              depth: StructureDepth.SCHOOL,
            },
          },
          {
            label: this.translate.t('report.assignee.title'),
            type: 'searchable-select',
            placeholder: this.translate.t('report.select_assignee.title'),
            formControlName: 'assignees',
            selectValues: [],
            required: false,
            isMultiple: true,
            isSearchable: true,
          },
          {
            label: this.translate.t('report.initiator.title'),
            type: 'searchable-select',
            placeholder: this.translate.t('report.select_initiator.title'),
            formControlName: 'initiators',
            selectValues: [],
            required: false,
            isMultiple: true,
            isSearchable: true,
          },
        ];
      }),
    );
  }

  exportReport() {
    const formVal = this.getFormValue();

    // Get the support type name from the form config
    let supportTypeName = '';
    if (formVal['supportType']) {
      const typeConfig = this.controlsConfigSource.value.find(
        (control) => control.formControlName === 'supportType',
      );
      const selectedType = typeConfig?.selectValues?.find(
        (option: any) => option.value === formVal['supportType'],
      );
      supportTypeName = selectedType?.displayedValue || '';
    }

    // Get the support category names from the form config
    const supportCategoryNames: { id: number; name: string }[] = [];
    if (formVal['supportCategory']?.length) {
      const categoryConfig = this.controlsConfigSource.value.find(
        (control) => control.formControlName === 'supportCategory',
      );
      formVal['supportCategory'].forEach((categoryId: number) => {
        const selectedCategory = categoryConfig?.selectValues?.find(
          (option: any) => option.value === categoryId,
        );
        if (selectedCategory) {
          supportCategoryNames.push({
            id: categoryId,
            name: selectedCategory.displayedValue,
          });
        }
      });
    }

    return {
      ...(formVal['dateRange'] && {
        dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
        dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
      }),
      ...(formVal['educationalPath']?.length && {
        educationalPath: formVal['educationalPath'],
      }),
      ...(formVal['escalationLevels']?.length && {
        escalationLevels: formVal['escalationLevels'],
      }),
      ...(formVal['status'] && {
        status: formVal['status'],
      }),
      ...(formVal['supportType'] && {
        supportType: {
          id: formVal['supportType'],
          name: supportTypeName,
        },
      }),
      ...(supportCategoryNames.length && {
        supportCategories: supportCategoryNames,
      }),
      ...(formVal['assignees']?.length && {
        assignees: formVal['assignees'].map((assignee: any) => ({
          id: assignee.id,
          name: assignee.fullName,
        })),
      }),
      ...(formVal['initiators']?.length && {
        initiators: formVal['initiators'].map((initiator: any) => ({
          id: initiator.id,
          name: initiator.fullName,
        })),
      }),
    };
  }

  getApiRoute(): string {
    return 'support-tickets-at-school-level';
  }
}

class PickupAtClassLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('global.date.title'),
        placeholder: this.translate.t('global.select_date.placeholder'),
        type: 'date-range',
        required: false,
        formControlName: 'dateRange',
      },
      {
        label: this.translate.t('global.schools_levels.title'),
        placeholder: this.translate.t('global.select_school_level.placeholder'),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        schoolStructureControlConfig: {
          depth: StructureDepth.LEVEL,
        },
        isMultiple: true,
      },
    ]);
  }

  exportReport() {
    const formVal = this.getFormValue();
    return {
      ...(formVal['dateRange'] && {
        dateFrom: formatDate(formVal['dateRange']?.from, 'yyyy-MM-dd'),
        dateTo: formatDate(formVal['dateRange']?.to, 'yyyy-MM-dd'),
      }),
    };
  }

  getApiRoute(): string {
    return 'pickup-at-class-level';
  }
}

class StudentGuardianReportAtClassLevel extends ReportStrategy {
  getFilterConfig(): Observable<ReportControlConfig[]> {
    return of([
      {
        label: this.translate.t('global.schools_levels_classes.title'),
        placeholder: this.translate.t(
          'global.schools_levels_classes.placeholder',
        ),
        type: 'school-structure',
        required: true,
        formControlName: 'targets',
        schoolStructureControlConfig: {
          depth: StructureDepth.CLASS,
        },
        isMultiple: true,
      },
    ]);
  }

  exportReport() {
    return {};
  }

  getApiRoute(): string {
    return 'student-guardian-report-at-class-level';
  }
}

@Injectable()
export class ReportsConfigService {
  private translation = inject(HesTranslateService);
  private reportsService = inject(ReportsService);
  private fb = inject(FormBuilder);
  private ticketTypeService = inject(TicketTypeService);

  private strategy: ReportStrategy;

  setStrategy(type: ReportType) {
    this.strategy?.destroy();
    switch (type) {
      case ReportType.ATTENDANCE_SUMMARY_AT_SCHOOL_LEVEL:
        this.strategy = new AttendanceSummarySchoolLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.DAILY_ATTENDANCE_AT_LEVEL_LEVEL:
        this.strategy = new AttendanceSummaryLevelLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.ATTENDANCE_SUMMARY_AT_STUDENT_LEVEL:
        this.strategy = new AttendanceSummaryStudentLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.ACTIVATION_AT_STUDENT_LEVEL:
        this.strategy = new StudentAccountActivation(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.ACTIVATION_AT_GUARDIAN_LEVEL:
        this.strategy = new GuardianAccountActivation(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.ACTIVATION_AT_EMPLOYEE_LEVEL:
        this.strategy = new EmployeeAccountActivation(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.USERS_ACTIVATION_AT_SCHOOL_LEVEL:
        this.strategy = new UserAccountActivationSchoolLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.CONTENT_INTERACTION_AT_SCHOOL_LEVEL:
        this.strategy = new InteractionWithContentAtSchoolLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.COMMUNICATIONS_AT_SCHOOL_LEVEL:
        this.strategy = new CommunicationAtSchoolLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.INTERACTION_WITH_CONTENT_AT_TEACHER_LEVEL:
        this.strategy = new InteractionAndCommunicationAtTeacherLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.INTERACTION_WITH_CONTENT_AT_STAFF_LEVEL:
        this.strategy = new InteractionWithContentAtStaffLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.SUPPORT_TICKETS_AT_SCHOOL_LEVEL:
        this.strategy = new SupportTickesAtSchoolLevel(
          this.fb,
          this.translation,
          this.reportsService,
          this.ticketTypeService,
        );
        break;
      case ReportType.PICKUP_AT_CLASS_LEVEL:
        this.strategy = new PickupAtClassLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      case ReportType.STUDENT_GUARDIAN_REPORT_AT_CLASS_LEVEL:
        this.strategy = new StudentGuardianReportAtClassLevel(
          this.fb,
          this.translation,
          this.reportsService,
        );
        break;
      default:
        throw new Error('no ReportStrategy class defined for this report type');
    }
  }

  getFilterConfig() {
    return this.strategy?.getFormConfig();
  }

  getForm() {
    return this.strategy.getForm();
  }

  exportReport(
    formVal = this.strategy?.getFormValue(),
    apiRoute = this.strategy?.getApiRoute(),
    strategyPayload = this.strategy?.exportReport(),
  ) {
    const basePayload = {
      targets: formVal['targets'].map(
        (target: {
          id: number;
          type: SchoolStructureEntityType;
          name: string;
        }) => {
          const { id, ...targetWithoutId } = target;
          return {
            ...targetWithoutId,
            type: target.type === 'sub-company' ? 'company' : target.type,
            entityId: target.id,
          };
        },
      ),
    };
    const payload = {
      ...basePayload,
      ...strategyPayload,
    };

    return this.reportsService.generateReport(payload, apiRoute);
  }
}
