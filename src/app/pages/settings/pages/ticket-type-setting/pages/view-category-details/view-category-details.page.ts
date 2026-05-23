import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { TicketTypeService } from '@shared/services/ticket-type.service';
import { IPagination } from '@shared/interfaces';
import { isMobile } from '@shared/utils/platform';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObjId } from '@shared/interfaces/common.interface';
import { TicketTypeColDefService } from '../../services/ticket-type-col-def.service';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { ActivatedRoute } from '@angular/router';
import { createSubCategoryDialog } from '../../components/add-edit-sub-category-dialog/add-edit-sub-category-dialog';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { TranslocoDirective } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { ListViewContainerComponent } from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { PageTitleService } from '@layout/page-title.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { SupportType } from '@shared/dto-transformation';

@Component({
  selector: 'app-view-category-details',
  templateUrl: './view-category-details.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HesButtonModule,
    TranslocoDirective,
    ListViewContainerComponent,
  ],
})
export class ViewCategoryDetailsPage implements OnInit {
  //#region Injectables
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly ticketTypeColDefService = inject(TicketTypeColDefService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef$ = inject(DestroyRef);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly translateService = inject(HesTranslateService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  //#endregion

  //#region Protected Properties
  protected category = signal<SupportType | null>(null);
  protected readonly subCategoriesPagination = signal<IPagination | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly subCategoriesList = signal<SupportType[]>([]); //specify type
  protected readonly displayContent = signal(false);
  protected readonly columnsDef = this.ticketTypeColDefService.columnsDef;
  protected readonly isMobile = isMobile();
  protected readonly faPlus = faPlus;
  primaryBtnConfig = {
    isVisible: () =>
      this.rbac.hasPermission(
        RESOURCE_PERMISSION.supportTicket.createSubCategory,
      ),
    iconProps: { icon: faPlus },
    text: this.translateService.t('support_tickets.add_sub_category.title'),
    onClick: () => this.onAddSubCategory(),
  };
  //#endregion

  // #region Angular reference
  listViewRef = viewChild(ListViewContainerComponent);
  // #endregion

  //#region Private Properties
  private id: ObjId | null = null;
  private addEditSubCategoryModal = createSubCategoryDialog();
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((params) => {
        this.id = params.get('subCategoryID');
      });
    this.getCategoryDetail();
    this.ticketTypeColDefService.reload = this.reload;
  }
  //#endregion

  //#region Protected Methods
  protected onAddSubCategory() {
    this.addEditSubCategoryModal({
      category: this.category()!,
      refreshCategories: () => {
        this.reload();
      },
    });
  }

  protected getSubCategoriesList = (params: any) => {
    return this.ticketTypeService.fetchSubCatgories({
      ...params,
      supportTypeId: this.id,
      paginated: true,
    });
  };
  //#endregion

  //#region Private Properties
  private getCategoryDetail() {
    this.ticketTypeService.fetchCategory(this.id!).subscribe({
      next: (response) => {
        this.breadcrumbService.set('@subCatName', response!.displayName);
        this.pageTitleService.setAliasValue(response!.displayName);
        this.category.set(response);
      },
    });
  }

  private reload = () => {
    this.listViewRef()?.triggerFetch();
  };
  //#endregion
}
