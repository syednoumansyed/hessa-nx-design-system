import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  ElementRef,
} from '@angular/core';
import { LayoutService } from '@layout/layout.service';
import { IonContent } from '@ionic/angular/standalone';
import { forkJoin, take } from 'rxjs';
import {
  SupportJourneySelectionChangeEvent,
  SupportJourneySelectionOption,
  SupportJourneySelectionStage,
  SupportJourneyStage,
} from '@pages/support-hub/data-access/journey/support-journey-stage.model';
import { SupportJourneyFactoryService } from '@pages/support-hub/data-access/journey/support-journey-factory.service';
import { SupportJourneyStudent } from '@pages/support-hub/data-access/journey/support-journey-student.model';
import { SupportHubCategoriesService } from '@pages/support-hub/data-access/support-hub-categories.service';
import {
  SupportCategory,
  SupportSubcategory,
} from '@pages/support-hub/data-access/support-category.interface';
import { SupportJourneyHeaderComponent } from './support-journey-header.component';
import { SupportJourneyShellComponent } from './support-journey-shell.component';
import type { DsIcon } from '@ds/icon/icon.component';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faHeadset,
  faQuestionCircle,
} from '@fortawesome/pro-regular-svg-icons';
import { getIconDefinitionByName } from '@ds/icon-chooser/icon-chooser.util';
import { UserType } from '@shared/enums';
import { AuthService } from '@auth/auth.service';
import { SupportTicketRequestModalComponent } from './support-ticket-request-modal.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { formatToHestime } from '@shared/utils/date';
import { isRtl } from '@shared/utils/platform';
import { DsModalService } from '@ds/modal';
import {
  findAllSchools,
  findItemWithParents,
  findSchoolStructureEntity,
} from '@shared/utils/school-structure';
import { SupportCustomField } from '@pages/support-hub/data-access/support-custom-field.interface';
import { SupportJourneySelectionService } from '@pages/support-hub/data-access/journey/support-journey-selection.service';

@Component({
  selector: 'app-support-ticket-journey',
  standalone: true,
  templateUrl: './support-ticket-journey.component.html',
  imports: [
    CommonModule,
    SupportJourneyHeaderComponent,
    SupportJourneyShellComponent,
    IonContent,
    DsTranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportTicketJourneyComponent implements OnInit, OnDestroy {
  private readonly introSequenceTimers: number[] = [];
  private readonly categoriesService = inject(SupportHubCategoriesService);
  private readonly journeyFactory = inject(SupportJourneyFactoryService);
  private readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly isRtlLayout = isRtl();
  private readonly modalService = inject(DsModalService);
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly translateService = inject(HesTranslateService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly journeySelection = inject(SupportJourneySelectionService);

  readonly students = input<readonly SupportJourneyStudent[]>([]);
  protected readonly initiatorType = computed(
    () => this.authService.user()?.type ?? UserType.GUARDIAN,
  );
  private readonly isManageUser = computed(() =>
    this.rbacService.hasSomePermission([
      RESOURCE_PERMISSION.supportTicket.updateTicket,
      RESOURCE_PERMISSION.supportTicket.reassign,
      RESOURCE_PERMISSION.supportTicket.resolveTicket,
    ]),
  );

  protected readonly studentCount = this.journeySelection.studentCount;

  protected readonly isUserGuardian = computed(
    () => this.initiatorType() === UserType.GUARDIAN,
  );
  protected readonly isUserPersonnel = computed(
    () => this.initiatorType() === UserType.PERSONNEL,
  );

  protected readonly shouldShowStudentSelectionModal = computed(
    () => this.isUserGuardian() && this.studentCount() > 1,
  );
  protected readonly selectedSchoolName = computed(() => {
    const selected = this.selectedSchool();
    return selected?.type === 'school' ? selected.name : null;
  });
  protected readonly selectedSchoolCampusName = computed(() => {
    const selected = this.selectedSchool();
    if (!selected) {
      return null;
    }
    const scope =
      this.schoolStructureScope.userScopedSchoolStructureTillSchool();
    const parents = findItemWithParents(scope, selected) ?? [];
    const campus = parents.find((item) => item.type === 'campus');
    return campus?.name ?? null;
  });
  protected readonly availableSchools = computed(() =>
    findAllSchools(
      this.schoolStructureScope.userScopedSchoolStructureTillSchool(),
    ),
  );
  private readonly selectedSchool = this.journeySelection.selectedSchool;

  readonly exit = output<void>();
  readonly studentsRequested = output<SupportJourneyStudent[]>();
  readonly ticketCreated = output<{
    ticketId: string | number | null;
    schoolId: number | null;
  }>();

  protected readonly supportIcon: IconDefinition = faHeadset;
  protected readonly isTabletOrDesktop = this.layoutService.isTabletOrDesktop;
  protected readonly isSplitView = computed(
    () => this.layoutService.windowClass() !== 'compact',
  );
  protected readonly journeyStages = signal<SupportJourneyStage[]>([]);
  protected readonly selectedCategoryId = signal<number | null>(null);
  protected readonly selectedSubcategoryId = signal<number | null>(null);
  protected readonly selectedCategoryAllowsPrivateRequest = signal(false);
  protected readonly isGuardianInitiator = computed(
    () => this.initiatorType() === UserType.GUARDIAN,
  );

  private readonly categories = this.categoriesService.categories;
  private readonly subcategories = this.categoriesService.subcategories;
  private readonly customFields = this.categoriesService.customFields;

  constructor() {
    this.categoriesService.loadCategories().subscribe({
      error: (error) => this.categoriesService.resetCategories(error),
    });

    effect(
      () => {
        const categories = this.categories();
        if (!categories.length) {
          return;
        }

        const stages = this.journeyStages();
        const categoryStage = stages.find(
          (stage): stage is SupportJourneySelectionStage =>
            stage.id === 'category-selection' &&
            stage.kind === 'categorySelection',
        );

        if (!categoryStage) {
          return;
        }

        const nextOptions = categories.map((category) =>
          this.mapCategoryToOption(category),
        );

        const existingOptions = categoryStage.options ?? [];
        const hasSameOptions =
          existingOptions.length === nextOptions.length &&
          existingOptions.every(
            (option, index) => option.id === nextOptions[index]?.id,
          );

        if (hasSameOptions) {
          return;
        }

        const updatedStages = stages.map((stage) => {
          if (
            stage.id !== 'category-selection' ||
            stage.kind !== 'categorySelection'
          ) {
            return stage;
          }

          return {
            ...stage,
            options: nextOptions,
          } satisfies SupportJourneySelectionStage;
        });

        this.journeyStages.set(updatedStages);
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        if (!this.isUserGuardian()) {
          return;
        }

        const selectedStudentSchoolId =
          this.students().find((student) => student.schoolId != null)
            ?.schoolId ?? null;
        if (!selectedStudentSchoolId) {
          return;
        }

        const selectedItem = findSchoolStructureEntity(
          this.schoolStructureScope.userScopedSchoolStructure(),
          'school',
          selectedStudentSchoolId,
        );

        if (selectedItem) {
          this.journeySelection.setSelectedSchoolOverride(selectedItem);
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    if (this.isUserPersonnel()) {
      const selected = this.selectedSchool();
      const schools = this.availableSchools();
      if (schools.length > 1) {
        if (!this.journeySelection.selectedSchoolOverride()) {
          void this.openSchoolSelectionModal(true);
          return;
        }
      }
      if (schools.length === 1 && selected?.type !== 'school') {
        this.schoolStructureScope.updateSelectedStructure(schools[0]);
      }
    }

    // Initialize journey immediately if no selection modal is needed
    this.initializeJourney();
  }

  ngOnDestroy(): void {
    this.clearIntroSequenceTimers();
  }

  protected onBack(): void {
    this.exit.emit();
  }

  protected onClose(): void {
    this.exit.emit();
  }

  protected onStudentsRequested(): void {
    this.openStudentSelectionModal();
  }

  protected onSchoolRequested(): void {
    void this.openSchoolSelectionModal(false);
  }

  private async openSchoolSelectionModal(isInitial: boolean): Promise<void> {
    const confirmed =
      await this.journeySelection.openSchoolSelectionModal(isInitial);

    if (confirmed) {
      if (this.journeyStages().length === 0) {
        this.initializeJourney();
      }
      return;
    }

    if (isInitial && this.journeyStages().length === 0) {
      this.exit.emit();
    }
  }

  private async openStudentSelectionModal(): Promise<void> {
    const currentSelectedIds = this.students().map((s) => s.id);

    const selected =
      await this.journeySelection.openStudentSelectionModal(currentSelectedIds);

    if (selected && selected.length > 0) {
      // Emit selected students to parent
      this.studentsRequested.emit(selected);

      // Initialize journey after students are selected (only on first load)
      if (this.journeyStages().length === 0) {
        this.initializeJourney();
      }
      return;
    }

    if (this.layoutService.isMobileOrTablet() && this.isUserGuardian()) {
      this.exit.emit();
      return;
    }

    // If no students selected and modal cancelled on first load, exit journey
    if (this.students().length === 0) {
      this.exit.emit();
    }
  }

  protected onStageEdit(stage: SupportJourneyStage): void {
    if (stage.kind === 'categorySelection') {
      this.resetCategorySelectionForEdit();
      return;
    }

    if (stage.kind === 'subcategorySelection') {
      this.resetSubcategorySelectionForEdit();
    }
  }

  protected onStageSelectionChange(
    event: SupportJourneySelectionChangeEvent,
  ): void {
    if (event.stage.kind === 'categorySelection') {
      this.applyCategorySelection(event.option);
      return;
    }

    if (event.stage.kind === 'subcategorySelection') {
      void this.applySubcategorySelection(event.option);
    }
  }

  private initializeJourney(): void {
    this.queueInitialJourneyStages();
    this.selectedCategoryId.set(null);
    this.selectedSubcategoryId.set(null);
  }

  private queueInitialJourneyStages(): void {
    this.clearIntroSequenceTimers();
    const userName = this.authService.user()?.displayName?.trim() ?? '';
    const introStage = this.journeyFactory.createIntroStage({
      id: 'intro',
      direction: 'receiver',
      title: this.translateService.translate('support.support.welcome', {
        name: userName,
      }),
      subtitle: 'We are here to guide you through your help request.',
      timestamp: this.getCurrentTimeLabel(),
      status: 'completed',
    });
    const promptStage = this.journeyFactory.createPromptStage({
      id: 'category-prompt',
      kind: 'categoryPrompt',
      direction: 'receiver',
      body: this.translateService.translate('support.chat.choose_issue'),
      timestamp: this.getCurrentTimeLabel(),
      status: 'completed',
    });
    const selectionStage = this.createCategorySelectionStage();

    this.journeyStages.set([introStage]);

    this.introSequenceTimers.push(
      window.setTimeout(() => {
        this.journeyStages.set([introStage, promptStage]);
      }, this.getIntroDelay(1000)),
    );

    this.introSequenceTimers.push(
      window.setTimeout(() => {
        this.journeyStages.set([introStage, promptStage, selectionStage]);
      }, this.getIntroDelay(2000)),
    );
  }

  private getIntroDelay(delayMs: number): number {
    return this.isManageUser() ? Math.floor(delayMs / 2) : delayMs;
  }

  private clearIntroSequenceTimers(): void {
    while (this.introSequenceTimers.length) {
      const timer = this.introSequenceTimers.pop();
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }

  private createCategorySelectionStage(): SupportJourneySelectionStage {
    return this.journeyFactory.createSelectionStage({
      id: 'category-selection',
      kind: 'categorySelection',
      direction: 'receiver',
      label: '...',
      editable: false,
      status: 'pending',
      timestamp: undefined,
      options: this.categories().map((category) =>
        this.mapCategoryToOption(category),
      ),
    });
  }

  private applyCategorySelection(option: SupportJourneySelectionOption): void {
    this.selectedCategoryId.set(option.id);
    this.selectedSubcategoryId.set(null);

    const allowPrivateRequest = option.allowPrivateRequest ?? false;
    this.selectedCategoryAllowsPrivateRequest.set(allowPrivateRequest);

    const categories = this.categories();
    const selectedCategory = categories.find(
      (category) => category.id === option.id,
    );

    const updatedStages = this.journeyStages().map((stage) => {
      if (stage.id !== 'category-selection') {
        return stage;
      }

      const selection = stage as SupportJourneySelectionStage;
      return {
        ...selection,
        direction: 'sender',
        label: selectedCategory?.displayName ?? option.label,
        icon: option.icon,
        iconCssClass: 'text-icon-high',
        editable: true,
        status: 'completed',
        timestamp: this.getCurrentTimeLabel(),
        selectedOptionId: option.id.toString(),
        allowPrivateRequest,
      } satisfies SupportJourneySelectionStage;
    });

    const baseStages = updatedStages.filter(
      (stage) =>
        stage.id !== 'subcategory-prompt' &&
        stage.id !== 'subcategory-selection' &&
        stage.id !== 'attachments-prompt' &&
        stage.id !== 'summary',
    );

    const promptStage = this.journeyFactory.createPromptStage({
      id: 'subcategory-prompt',
      kind: 'subcategoryPrompt',
      direction: 'receiver',
      body: this.translateService.translate(
        allowPrivateRequest
          ? 'support.chat.choose_private_topic_desc'
          : 'support.chat.choose_topic_desc',
      ),
      allowPrivateRequest,
      timestamp: this.getCurrentTimeLabel(),
      status: 'completed',
    });

    const pendingSubcategoryStage = this.journeyFactory.createSelectionStage({
      id: 'subcategory-selection',
      kind: 'subcategorySelection',
      direction: 'receiver',
      label: '...',
      editable: false,
      status: 'pending',
      timestamp: undefined,
      options: [],
      allowPrivateRequest,
    });

    const newStages = [...baseStages, promptStage, pendingSubcategoryStage];
    this.journeyStages.set(newStages);
    this.scheduleSubcategoryPromptScroll();

    // Reset and fetch both subcategories and custom fields
    this.categoriesService.resetSubcategories();
    this.categoriesService.resetCustomFields();

    forkJoin({
      subcategories: this.categoriesService.loadSubcategories(option.id),
      customFields: this.categoriesService.loadCustomFields(option.id),
    })
      .pipe(take(1))
      .subscribe({
        next: ({ subcategories }) => {
          const subcategoryStage = this.journeyFactory.createSelectionStage({
            ...pendingSubcategoryStage,
            options: subcategories.map((subcategory) =>
              this.mapSubcategoryToOption(subcategory),
            ),
          });

          this.journeyStages.set([
            ...baseStages,
            promptStage,
            subcategoryStage,
          ]);
          this.scheduleSubcategoryPromptScroll();
        },
        error: (error) => {
          this.categoriesService.resetSubcategories(error);
          this.categoriesService.resetCustomFields(error);
          this.journeyStages.set([...baseStages, promptStage]);
          this.scheduleSubcategoryPromptScroll();
        },
      });
  }

  private scheduleSubcategoryPromptScroll(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.scrollToSubcategoryPrompt());
    });
  }

  private scrollToSubcategoryPrompt(): void {
    const container = this.host.nativeElement.querySelector(
      '[data-journey-scroll]',
    ) as HTMLElement | null;
    const prompt = this.host.nativeElement.querySelector(
      '[data-subcategory-prompt="true"]',
    ) as HTMLElement | null;
    if (!container || !prompt) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const promptRect = prompt.getBoundingClientRect();
    const offsetTop = promptRect.top - containerRect.top + container.scrollTop;
    container.scrollTo({
      top: Math.max(offsetTop - 12, 0),
      behavior: 'smooth',
    });
  }

  private async applySubcategorySelection(
    option: SupportJourneySelectionOption,
  ): Promise<void> {
    this.selectedSubcategoryId.set(option.id);
    const allowPrivateRequest =
      this.selectedCategoryAllowsPrivateRequest() || option.allowPrivateRequest;
    this.selectedCategoryAllowsPrivateRequest.set(allowPrivateRequest);

    const updatedStages = this.journeyStages().map((stage) => {
      if (stage.id !== 'subcategory-selection') {
        return stage;
      }

      const selection = stage as SupportJourneySelectionStage;
      return {
        ...selection,
        direction: 'sender',
        label: option.label,
        icon: option.icon,
        iconCssClass: 'text-icon-high',
        editable: true,
        status: 'completed',
        timestamp: this.getCurrentTimeLabel(),
        selectedOptionId: option.id.toString(),
        allowPrivateRequest,
      } satisfies SupportJourneySelectionStage;
    });

    this.journeyStages.set(updatedStages);

    await this.openSubmitRequestModal(option);
  }

  private resetCategorySelectionForEdit(): void {
    this.selectedCategoryId.set(null);
    this.selectedSubcategoryId.set(null);
    this.selectedCategoryAllowsPrivateRequest.set(false);

    const refreshedCategoryStage = this.createCategorySelectionStage();

    const trimmedStages = this.journeyStages().filter(
      (stage) =>
        stage.id !== 'subcategory-prompt' &&
        stage.id !== 'subcategory-selection' &&
        stage.id !== 'attachments-prompt' &&
        stage.id !== 'summary',
    );

    const updatedStages = trimmedStages.map((stage) =>
      stage.id === 'category-selection' ? refreshedCategoryStage : stage,
    );

    this.journeyStages.set(updatedStages);
    this.categoriesService.resetSubcategories();
    this.categoriesService.resetCustomFields();
  }

  private resetSubcategorySelectionForEdit(): void {
    this.selectedSubcategoryId.set(null);

    const subcategoryOptions = this.subcategories().map((subcategory) =>
      this.mapSubcategoryToOption(subcategory),
    );

    const refreshedSubcategoryStage = this.journeyFactory.createSelectionStage({
      id: 'subcategory-selection',
      kind: 'subcategorySelection',
      direction: 'receiver',
      label: '...',
      editable: false,
      status: 'pending',
      timestamp: undefined,
      options: subcategoryOptions,
      allowPrivateRequest: this.selectedCategoryAllowsPrivateRequest(),
    });

    const trimmedStages = this.journeyStages().filter(
      (stage) => stage.id !== 'attachments-prompt' && stage.id !== 'summary',
    );

    const updatedStages = trimmedStages.map((stage) =>
      stage.id === 'subcategory-selection' ? refreshedSubcategoryStage : stage,
    );

    this.journeyStages.set(updatedStages);
  }

  private mapCategoryToOption(
    category: SupportCategory,
  ): SupportJourneySelectionOption {
    return {
      id: category.id,
      label: category.displayName,
      description: category.description ?? undefined,
      icon: getIconDefinitionByName(category.icon) ?? faQuestionCircle,
      allowPrivateRequest: category.allowPrivateRequest ?? false,
    };
  }

  private mapSubcategoryToOption(
    subcategory: SupportSubcategory,
  ): SupportJourneySelectionOption {
    return {
      id: subcategory.id,
      label: subcategory.displayName,
      description: subcategory.description ?? undefined,
      icon: getIconDefinitionByName(subcategory.icon) ?? faQuestionCircle,
      allowPrivateRequest: subcategory.allowPrivateRequest ?? false,
    };
  }

  private async openSubmitRequestModal(
    option: SupportJourneySelectionOption,
  ): Promise<void> {
    const subcategory = this.subcategories().find(
      (item) => item.id === option.id,
    );
    const selectedSchool = this.selectedSchool();

    if (!subcategory) {
      this.resetSubcategorySelectionForEdit();
      return;
    }

    const guardianSchoolId =
      this.students().find((student) => student.schoolId != null)?.schoolId ??
      null;
    const schoolId =
      guardianSchoolId ??
      (selectedSchool?.type === 'school' ? selectedSchool.id : null);

    if (!schoolId) {
      console.error('No school ID available for ticket creation');
      this.resetSubcategorySelectionForEdit();
      return;
    }

    const modalRef = await this.modalService.open<
      {
        subcategoryName: string;
        supportTypeId: number;
        supportCategoryId: number;
        schoolId: number;
        studentIds: string[];
        allowPrivateRequest: boolean;
        customFields: SupportCustomField[];
      },
      { ticketId: string | number | null }
    >({
      component: SupportTicketRequestModalComponent,
      componentProps: {
        subcategoryName: subcategory.displayName,
        supportTypeId: subcategory.supportTypeId,
        supportCategoryId: subcategory.id,
        schoolId: schoolId,
        studentIds: this.students().map((s) => s.id),
        allowPrivateRequest: this.selectedCategoryAllowsPrivateRequest(),
        customFields: this.customFields(),
      },
      size: 'lg',
      contentClass: 'p-ds-xl',
      cssClass: 'support-ticket-request-modal',
      backdropDismiss: this.layoutService.isMobile(),
    });

    const { data, role } = await modalRef.onDismiss();

    if (role === 'submitted') {
      this.ticketCreated.emit({
        ticketId: data?.ticketId ?? null,
        schoolId: schoolId ?? null,
      });
      this.exit.emit();
      return;
    }

    this.resetSubcategorySelectionForEdit();
  }

  private getCurrentTimeLabel(): string {
    return (
      formatToHestime(new Date().toISOString(), this.isRtlLayout) ??
      new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date())
    );
  }
}
