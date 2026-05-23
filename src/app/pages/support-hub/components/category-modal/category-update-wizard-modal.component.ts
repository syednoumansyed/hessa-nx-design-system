import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import {
  faArrowLeft,
  faCircleQuestion,
} from '@fortawesome/pro-regular-svg-icons';
import { faXmarkCircle } from '@fortawesome/pro-solid-svg-icons';
import { getIconDefinitionByName } from '@ds/icon-chooser/icon-chooser.util';
import {
  SelectionListComponent,
  SelectionListItem,
} from './selection-list.component';
import { UpdateCategoryFormComponent } from './update-category-form.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { SupportHubCategoriesService } from '@pages/support-hub/data-access/support-hub-categories.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  SupportCategory,
  SupportSubcategory,
} from '@pages/support-hub/data-access/support-category.interface';
import { SupportHubTicketsService } from '@pages/support-hub/data-access/support-hub-tickets.service';
import { UserInfoPillData } from '@pages/support-hub/components/user-info-pill/user-info-pill.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { findSchoolStructureEntity } from '@shared/utils/school-structure';
import { SupportHubTicket } from '@pages/support-hub/data-access/support-hub-initiated-tickets.interface';

type WizardStage = 'category' | 'subcategory' | 'form';

export interface UpdateCategoryPayload {
  supportTypeId: number;
  supportCategoryId: number;
}

@Component({
  selector: 'app-category-update-wizard-modal',
  standalone: true,
  templateUrl: './category-update-wizard-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DsIconComponent,
    SelectionListComponent,
    UpdateCategoryFormComponent,
  ],
})
export class CategoryUpdateWizardModalComponent implements OnInit {
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly categoriesService = inject(SupportHubCategoriesService);
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  // Hold preselected subcategory id from ticket to highlight later
  private readonly preselectedSubcategoryId = signal<number | null>(null);

  ngOnInit(): void {
    this.categoriesService
      .loadCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => console.error('Failed to load categories', error),
      });

    const ticket = this.ticket();
    if (ticket?.supportType?.id) {
      this.selectedCategory.set({
        id: ticket.supportType.id,
        title: ticket.supportType.displayName || '',
        description: '',
        icon: '',
      });
      // Store subcategory id for later highlight when user clicks category
      this.preselectedSubcategoryId.set(ticket.supportCategory?.id ?? null);
      // Do not load subcategories here; user may choose a different category.
    }
  }

  readonly ticket = input<SupportHubTicket | null>(null);
  readonly onSubmit = input<
    ((payload: UpdateCategoryPayload) => Promise<void> | void) | undefined
  >(undefined);
  closeModal?: (data?: unknown, role?: string) => void;

  protected readonly closeIcon = faXmarkCircle;
  protected readonly backIcon = faArrowLeft;

  // Stage management
  protected readonly currentStage = signal<WizardStage>('category');
  protected readonly selectedCategory = signal<SelectionListItem | null>(null);
  protected readonly selectedSubcategory = signal<SelectionListItem | null>(
    null,
  );
  protected readonly isSubmitting = signal(false);
  protected readonly formAssignees = signal<UserInfoPillData[]>([]);

  // Compute campus and school names from the scoped structure using ticket.schoolId
  protected readonly selectedSchoolName = computed<string | null>(() => {
    const ticket = this.ticket();
    if (!ticket) {
      return '';
    }
    const schoolId: number | undefined = ticket?.schoolId;
    if (!schoolId) return null;
    const scope = this.schoolStructureScope.userScopedSchoolStructure();
    const school = findSchoolStructureEntity(scope, 'school', schoolId);
    return school?.name ?? null;
  });

  protected readonly selectedCampusName = computed<string | null>(() => {
    const ticket = this.ticket();
    if (!ticket) {
      return '';
    }
    const schoolId: number | undefined = ticket?.schoolId;
    if (!schoolId) return null;
    const scope = this.schoolStructureScope.userScopedSchoolStructure();
    const school = findSchoolStructureEntity(scope, 'school', schoolId);
    const campus = school?.parentId
      ? findSchoolStructureEntity(scope, 'campus', school.parentId)
      : null;
    return campus?.name ?? null;
  });

  // Mapper functions
  private mapCategoryToSelectionListItem(
    category: SupportCategory,
  ): SelectionListItem {
    return {
      id: category.id,
      title: category.displayName,
      description: category.description ?? '',
      icon: getIconDefinitionByName(category.icon) ?? faCircleQuestion,
    };
  }

  private mapSubcategoryToSelectionListItem(
    subcategory: SupportSubcategory,
  ): SelectionListItem {
    return {
      id: subcategory.id,
      title: subcategory.displayName,
      description: subcategory.description ?? '',
      icon: getIconDefinitionByName(subcategory.icon) ?? faCircleQuestion,
    };
  }

  // Computed values
  protected readonly showBackButton = computed(
    () => this.currentStage() !== 'category',
  );

  protected readonly modalTitle = computed(() => {
    const stage = this.currentStage();
    if (stage === 'category') return 'Update category';
    if (stage === 'subcategory')
      return this.selectedCategory()?.title || 'Select subcategory';
    return "Update ticket's category";
  });

  protected readonly modalSubtitle = computed(() => {
    return this.currentStage() === 'subcategory'
      ? 'Specify your issue category'
      : null;
  });

  // Use service signals directly
  protected readonly categoriesToDisplay = computed(() => {
    return this.categoriesService
      .categoriesForDisplay()
      .map((cat) => this.mapCategoryToSelectionListItem(cat));
  });

  protected readonly subcategoriesToDisplay = computed(() => {
    return this.categoriesService
      .subcategoriesForDisplay()
      .map((sub) => this.mapSubcategoryToSelectionListItem(sub));
  });

  // Event handlers
  protected handleCategorySelect(category: SelectionListItem): void {
    this.selectedCategory.set(category);
    this.selectedSubcategory.set(null);
    this.formAssignees.set([]);

    const categoryId = category.id;
    const schoolId: number | undefined = this.ticket()?.schoolId;

    this.categoriesService
      .loadSubcategories(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Highlight previously selected subcategory (if it belongs to this category)
          const preId = this.preselectedSubcategoryId();
          if (preId) {
            const subcats = this.categoriesService.subcategoriesForDisplay();
            const subMatch = subcats.find((s) => s.id === preId);
            if (subMatch) {
              this.selectedSubcategory.set(
                this.mapSubcategoryToSelectionListItem(subMatch),
              );
            }
          }
          // Move to subcategory stage only after user clicked category
          this.currentStage.set('subcategory');
        },
        error: (error) => console.error('Failed to load subcategories', error),
      });

    // Fetch default personnel for this category and current school
    if (schoolId) {
      this.supportHubTicketsService
        .getCategoryDefaultPersonnel(schoolId, categoryId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (list) => {
            const mapped: UserInfoPillData[] = list.map((p) => ({
              fullName: p.displayName,
              subtitle: p.roles,
              imageUrl: null,
              color: p.profileColor,
            }));
            this.formAssignees.set(mapped);
          },
          error: (err) =>
            console.error('Failed to load default personnel', err),
        });
    }
  }

  protected handleSubcategorySelect(subcategory: SelectionListItem): void {
    this.selectedSubcategory.set(subcategory);
    this.currentStage.set('form');
  }

  protected handleBack(): void {
    const stage = this.currentStage();
    if (stage === 'subcategory') this.currentStage.set('category');
    else if (stage === 'form') this.currentStage.set('subcategory');
  }

  protected async handleFormSubmit(): Promise<void> {
    const submitHandler = this.onSubmit();
    const category = this.selectedCategory();
    const subcategory = this.selectedSubcategory();

    if (!category || !subcategory) return;

    if (!submitHandler) {
      this.closeModal?.(
        {
          categoryId: category.id,
          categoryTitle: category.title,
          subcategoryId: subcategory.id,
          subcategoryTitle: subcategory.title,
        },
        'submit',
      );
      return;
    }

    this.isSubmitting.set(true);
    try {
      const payload: UpdateCategoryPayload = {
        supportTypeId: category.id,
        supportCategoryId: subcategory.id,
      };

      await Promise.resolve(submitHandler(payload));

      this.closeModal?.(
        {
          categoryId: category.id,
          categoryTitle: category.title,
          subcategoryId: subcategory.id,
          subcategoryTitle: subcategory.title,
        },
        'submit',
      );
    } catch (error) {
      console.error('Failed to update category', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected handleFormCancel(): void {
    this.closeModal?.(null, 'cancel');
  }

  protected onClose(): void {
    this.closeModal?.(null, 'cancel');
  }
}
