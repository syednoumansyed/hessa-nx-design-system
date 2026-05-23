import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { TicketTypeService } from '@shared/services/ticket-type.service';
import { IPagination } from '@shared/interfaces';
import { isMobile } from '@shared/utils/platform';
import { CategoryComponent } from '@pages/settings/pages/ticket-type-setting/components/category/category.component';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { SupportType } from '@shared/dto-transformation';
import { createManageCategoryDialog } from '../components/manage-category-dialog';

@Component({
  selector: 'app-ticket-type-setting',
  templateUrl: './ticket-type-setting.page.html',
  standalone: true,
  imports: [
    IonSpinner,
    IonContent,
    CommonModule,
    FormsModule,
    NoDataCardComponent,
    RouterModule,
    HesButtonModule,
    HessaBtnDirective,
    TranslocoDirective,
    CategoryComponent,
    RbacDirective,
  ],
})
export class TicketTypeSettingPage implements OnInit {
  //#region Injectables
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly openManageCategoryDialog = createManageCategoryDialog();
  //#endregion

  //#region Protected Properties
  protected readonly paginate = signal<IPagination | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly displayContent = signal(false);
  protected readonly isMobile = isMobile();

  protected readonly addCategoryPermission =
    RESOURCE_PERMISSION.supportTicket.createCategory;
  protected faPlus = faPlus;
  protected categories = signal<SupportType[]>([]);

  protected readonly noDataCardConfig = computed(() => {
    return {
      mainImagePath: 'assets/illustrations/no_data.svg',
      title: this.hesTranslateService.t('content_management.no_category_title'),
      description: this.hesTranslateService.t(
        'support_tickets.no_category.txt',
      ),
      primaryBtn: {
        label: this.hesTranslateService.t('support_tickets.add_category.btn'),
        onAction: () => {
          this.router.navigate(['add'], { relativeTo: this.route });
        },
      },
    };
  });
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit() {
    this.fetchCategories();
  }

  ionViewWillEnter() {
    this.fetchCategories();
  }
  //#endregion

  // #region Protected Methods
  protected onAddCategory() {
    this.openManageCategoryDialog({
      refreshCategories: () => this.fetchCategories(),
    });
  }

  protected refreshCategories() {
    this.fetchCategories();
  }
  //#endregion

  //#region Private Methods
  private fetchCategories() {
    this.isLoading.set(true);
    const addCategoryCounts = true;
    this.ticketTypeService
      .fetchCategories({ addCategoryCounts, order: 'desc' })
      .subscribe({
        next: (response) => {
          this.categories.set(response);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }
  //#endregion
}
