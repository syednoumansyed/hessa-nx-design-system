import { Component, OnDestroy, inject, signal } from '@angular/core';
import { IonContent, ModalController } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { HelpCenterSupportTicketsService as MySupportTicketsService } from '../../data-access/support-tickets.service';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import { SupportTicketsColDefService } from '../../support-tickets-col-def.service';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { ITableModel } from '@ui-kit/hes-table/model';
import { ListingHeaderComponent } from '@shared/components/user-listing-header/listing-header.component';
import { Subscription } from 'rxjs';
import {
  SizeColumnsToFitGridStrategy,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { openInitiatorTicketDetailsModal } from './components/my-ticket-details-dialog/ticket-details-dialog';
import { LayoutService } from '@layout/layout.service';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupportTicketListItem } from '@shared/dto-transformation';
import { ActivatedRoute } from '@angular/router';

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
  providers: [SupportTicketsColDefService],
})
export class SupportTicketsPage implements OnDestroy {
  columns = this.supportTicketsColDefService.columns;
  supportTicketsList = this.MySupportTicketsService.supportTickets;
  supportTicketsPagination =
    this.MySupportTicketsService.supportTicketsPagination;
  noRowsOverlayComponentParams =
    this.supportTicketsColDefService.noRowsOverlayComponentParams;
  autoSizeStrategy:
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToContentStrategy
    | undefined = { type: 'fitGridWidth' };

  private schoolScopeService = inject(SchoolStructureScopeService);
  readonly modalCtrl = inject(ModalController);
  private readonly layout = inject(LayoutService);
  private route = inject(ActivatedRoute);

  public createTicketPermissionId =
    RESOURCE_PERMISSION.supportTicket.createTicket;

  private subscripiton = new Subscription();
  isLoading = signal(false);
  readonly requiredScopes: Array<HesScope> = ['school'];
  displayContent = signal(false);
  private pendingDeepLinkedTicketId: number | undefined;

  constructor(
    private MySupportTicketsService: MySupportTicketsService,
    private supportTicketsService: SupportTicketsService,
    private supportTicketsColDefService: SupportTicketsColDefService,
  ) {
    // capture query param (ticketId) once
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((qp) => {
      const ticketId = qp.get('ticketId');
      if (ticketId) {
        const parsed = Number(ticketId);
        if (!isNaN(parsed)) {
          this.pendingDeepLinkedTicketId = parsed;
        }
      }
    });
    toObservable(this.schoolScopeService.selectedSchoolId)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.fetchSupportTickets();
      });
    // invoke lifecycle manually to ensure initial load and mark method as used
    this.ionViewWillEnter();
  }

  // ionViewWillEnter used by Ionic lifecycle even if not directly referenced elsewhere
  ionViewWillEnter() {
    this.fetchSupportTickets();
    this.subscripiton.add(
      this.supportTicketsColDefService.refresh$.subscribe(() => {
        this.fetchSupportTickets();
      }),
    );
  }

  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  fetchSupportTickets() {
    this.isLoading.set(true);
    let schoolId: number | undefined =
      this.schoolScopeService.selectedSchoolStructureItem()?.id;
    if (schoolId) {
      this.MySupportTicketsService.getMyInitiatedTickets({
        schoolId,
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          // attempt deep link after successful load
          this.tryOpenDeepLinkedTicket();
        },
        error: () => {
          this.isLoading.set(false);
          // even if list fails, attempt direct deep link fetch
          this.tryOpenDeepLinkedTicket(true);
        },
      });
    } else {
      // no school selected yet; still attempt direct fetch
      this.isLoading.set(false);
      this.tryOpenDeepLinkedTicket(true);
    }
  }

  onTableModelChanged(event: ITableModel<SupportTicketListItem>) {
    let schoolId: number | undefined =
      this.schoolScopeService.selectedSchoolStructureItem()?.id;
    if (event && schoolId) {
      const { order, pageNumber, itemsPerPage } = event;
      let newParams = {
        schoolId,
        ...(order && { order }),
        ...(pageNumber && { pageNumber: pageNumber.toString() }),
        ...(itemsPerPage && { itemsPerPage: itemsPerPage.toString() }),
      };
      this.isLoading.set(true);

      this.MySupportTicketsService.getMyInitiatedTickets(newParams).subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
    }
  }

  onRowClicked(event: SupportTicketListItem) {
    this.layout.showProgressBar();
    this.supportTicketsService.getTicketDetailAsInitiator(event.id).subscribe({
      next: (res) => {
        this.layout.hideProgressBar();
        openInitiatorTicketDetailsModal({
          ticketDetails: signal(res),
          modalCtrl: this.modalCtrl,
          closeModal: () => {
            this.modalCtrl.dismiss();
          },
        });
      },
      error: () => {
        this.layout.hideProgressBar();
      },
    });
  }

  onAddSupportTicket() {
    this.supportTicketsColDefService.openTicketForm();
  }

  private tryOpenDeepLinkedTicket(forceDirect = false) {
    if (this.pendingDeepLinkedTicketId) {
      if (!forceDirect) {
        const ticket = this.supportTicketsList().find(
          (t) => t.id === this.pendingDeepLinkedTicketId,
        );
        if (ticket) {
          this.onRowClicked(ticket);
          this.pendingDeepLinkedTicketId = undefined;
          return;
        }
      }
      // fallback direct fetch
      this.layout.showProgressBar();
      this.supportTicketsService
        .getTicketDetailAsInitiator(this.pendingDeepLinkedTicketId)
        .subscribe({
          next: (res) => {
            this.layout.hideProgressBar();
            openInitiatorTicketDetailsModal({
              ticketDetails: signal(res),
              modalCtrl: this.modalCtrl,
              closeModal: () => {
                this.modalCtrl.dismiss();
              },
            });
            this.pendingDeepLinkedTicketId = undefined;
          },
          error: () => {
            this.layout.hideProgressBar();
            this.pendingDeepLinkedTicketId = undefined;
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.subscripiton.unsubscribe();
  }
}
