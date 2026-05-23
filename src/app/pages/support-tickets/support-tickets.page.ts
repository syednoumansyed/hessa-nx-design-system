import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { ITableModel } from '@ui-kit/hes-table/model';
import { ListingHeaderComponent } from '@shared/components/user-listing-header/listing-header.component';
import { Subscription } from 'rxjs';
import { IAssignedSupportTicketListItem } from '@shared/interfaces/support-tickets.interface';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AssignedSupportTicketsColDefService } from './support-tickets-col-def.service';
import { AssignedSupportTicketsService } from './data-access/assigned-support-tickets.service';
import { Router } from '@angular/router';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { SupportTicketListItem } from '@shared/dto-transformation';

@Component({
  selector: 'app-support-tickets',
  templateUrl: './support-tickets.page.html',
  standalone: true,
  imports: [
    HesTableComponent,
    IonContent,
    TranslocoDirective,
    ListingHeaderComponent,
    NoSelectedScopeCardComponent,
  ],
  providers: [AssignedSupportTicketsColDefService],
})
export class SupportTicketsPage implements OnInit, OnDestroy {
  columns = this.assignedSupportTicketsColDefService.columns;
  supportTicketsList = this.assignedSupportTicketsService.supportTickets;
  supportTicketsPagination =
    this.assignedSupportTicketsService.supportTicketsPagination;
  noRowsOverlayComponentParams =
    this.assignedSupportTicketsColDefService.noRowsOverlayComponentParams;
  readonly requiredScopes: Array<HesScope> = ['school'];

  private subscripiton = new Subscription();

  readonly isLoading = signal(false);

  readonly displayContent = signal(false);

  private readonly destoryRef = inject(DestroyRef);
  constructor(
    private schoolScopeService: SchoolStructureScopeService,
    private assignedSupportTicketsService: AssignedSupportTicketsService,
    private supportTicketsService: SupportTicketsService,
    private assignedSupportTicketsColDefService: AssignedSupportTicketsColDefService,
    private router: Router,
  ) {
    toObservable(this.schoolScopeService.selectedSchoolId)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.fetchSupportTickets();
      });
  }
  ngOnInit(): void {
    this.assignedSupportTicketsColDefService.reload$
      .pipe(takeUntilDestroyed(this.destoryRef))
      .subscribe(() => {
        this.fetchSupportTickets();
      });
  }

  ionViewWillEnter() {
    if (this.schoolScopeService.selectedSchoolId()) {
      this.fetchSupportTickets();
    }
  }

  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  fetchSupportTickets() {
    this.isLoading.set(true);
    if (this.schoolScopeService.selectedSchoolId()) {
      this.assignedSupportTicketsService
        .getMyAssignedTickets({
          schoolId: this.schoolScopeService.selectedSchoolId()!,
        })
        .subscribe({
          next: () => {
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
    }
  }

  onTableModelChanged(event: ITableModel<IAssignedSupportTicketListItem>) {
    let schoolId: number | undefined =
      this.schoolScopeService.selectedSchoolStructureItem()?.id;
    if (event && schoolId) {
      const {
        order,
        pageNumber,
        itemsPerPage,
        supportType,
        supportCategory,
        ...params
      } = event;
      let newParams = {
        ...params,
        schoolId,
        ...(supportType && { supportTypeId: supportType }),
        ...(supportCategory && { supportCategoryId: supportCategory }),
        ...(order && { order }),
        ...(pageNumber && { pageNumber: pageNumber.toString() }),
        ...(itemsPerPage && { itemsPerPage: itemsPerPage.toString() }),
      };
      this.isLoading.set(true);
      this.assignedSupportTicketsService
        .getMyAssignedTickets(newParams)
        .subscribe({
          next: () => {
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
      if (event.supportType) {
        this.isLoading.set(true);
        this.supportTicketsService
          .getSupportsCategories(+event.supportType)
          .subscribe({
            next: () => {
              this.isLoading.set(false);
            },
            error: () => {
              this.isLoading.set(false);
            },
          });
      }
    }
  }

  onRowClicked(event: SupportTicketListItem) {
    this.router.navigate(['/support-tickets', event.id]);
  }

  ngOnDestroy(): void {
    this.subscripiton.unsubscribe();
  }
}
