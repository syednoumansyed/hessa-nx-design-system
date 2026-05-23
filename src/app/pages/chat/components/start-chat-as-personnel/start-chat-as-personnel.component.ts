import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ClassSelectionComponent } from './class-selection/class-selection.component';
import { isMobile } from '@shared/utils/platform';
import { ChatUserSelectionComponent } from './chat-user-selection/chat-user-selection.component';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { ChatStudent } from '@pages/chat/data-access/chat.interface';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import { ChannelSelectionComponent } from './channel-selection/channel-selection.component';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { DsModalHeaderConfig } from '@ds/modal/modal.component';

@Component({
  selector: 'app-start-chat-as-personnel',
  templateUrl: './start-chat-as-personnel.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    ClassSelectionComponent,
    SearchBoxComponent,
    ChatUserSelectionComponent,
    ChannelSelectionComponent,
    NoDataCardComponent,
  ],
})
export class StartChatAsPersonnelComponent {
  private readonly chatService = inject(ChatService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly transloco = inject(TranslocoService);

  readonly selectedAcademicYearId?: number =
    this.academicYearScopeService.selectedAcademicYear()?.id;

  closeModal?: (data?: unknown, role?: string) => void;
  selectedClassId = signal<number | undefined>(undefined);
  isMobile = isMobile();
  isTeacher = this.rbac.isTeacher();

  studentsList = signal<ChatStudent[]>([]);
  currentPage = signal<number>(1);
  isLoading = signal<boolean>(false);
  hasMorePages = signal<boolean>(true);
  searchText = signal<string>('');
  showInfiniteScroll = signal<boolean>(true);
  noSearchResults = signal<boolean>(false);

  availableGroupsList = computed(() => this.chatService.availableGroupsList());
  classGroup = computed(() => {
    return this.chatService.getClassGroup(this.selectedClassId() || 0);
  });

  // Dynamic header config signal - the modal wrapper watches this
  headerConfig = computed<DsModalHeaderConfig | undefined>(() => {
    if (this.selectedClassId()) {
      return {
        title: this.transloco.translate('chats.start_chat.btn'),
        showBackButton: true,
        showCloseButton: true,
      };
    }
    return {
      title: this.transloco.translate('chats.select_class.title'),
      subtitle: this.transloco.translate('chats.next_select_recipients.txt'),
      showCloseButton: true,
    };
  });

  @ViewChild(ChatUserSelectionComponent)
  chatUserSelectionComponent?: ChatUserSelectionComponent;

  onClassSelected(classId: number) {
    this.selectedClassId.set(classId);
    this.currentPage.set(1);
    this.hasMorePages.set(true);
    this.isLoading.set(false);
    this.studentsList.set([]);
    this.searchText.set('');
    this.enableInfiniteScroll();
    this.fetchStudentsList();
  }

  // Called by the modal wrapper when back button is clicked
  onBackClick() {
    if (this.selectedClassId()) {
      this.selectedClassId.set(undefined);
      this.studentsList.set([]);
      this.currentPage.set(1);
      this.hasMorePages.set(true);
      this.isLoading.set(false);
      this.searchText.set('');
      this.enableInfiniteScroll();
    } else {
      this.onCloseModal();
    }
  }

  fetchStudentsList(pageNumber: number = 1, append: boolean = false) {
    const classId = this.selectedClassId();
    if (!classId || this.isLoading()) return;

    this.isLoading.set(true);

    const params: any = {
      classId: classId,
      pageNumber: pageNumber,
      itemsPerPage: 20,
      academicYearId: this.selectedAcademicYearId,
    };

    const currentSearchText = this.searchText();
    if (currentSearchText.trim()) {
      params.searchText = currentSearchText.trim();
    }

    this.chatService.getStudentsList(params).subscribe({
      next: (res) => {
        const mappedStudents: ChatStudent[] = res.data || [];

        const paginate = res.paginate;
        if (paginate) {
          this.currentPage.set(paginate.pageNumber);
          const hasMore = paginate.pageNumber < paginate.totalPages;
          this.hasMorePages.set(hasMore);
          if (hasMore) {
            this.enableInfiniteScroll();
          } else {
            this.disableInfiniteScroll();
          }
        }

        if (append) {
          this.studentsList.update((current) => [
            ...current,
            ...mappedStudents,
          ]);
        } else {
          this.studentsList.set(mappedStudents);
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      },
    });
  }

  onSearchChange(searchText: string) {
    this.searchText.set(searchText);

    this.currentPage.set(1);
    this.hasMorePages.set(true);
    this.isLoading.set(false);
    this.studentsList.set([]);
    this.enableInfiniteScroll();
    this.fetchStudentsList();
  }

  onLoadMore(event: any) {
    if (this.hasMorePages() && !this.isLoading()) {
      const nextPage = this.currentPage() + 1;
      this.fetchStudentsList(nextPage, true);
    }

    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  private enableInfiniteScroll() {
    this.showInfiniteScroll.set(false);
    setTimeout(() => {
      this.showInfiniteScroll.set(true);
    }, 100);
  }

  private disableInfiniteScroll() {
    setTimeout(() => {
      if (this.chatUserSelectionComponent?.infiniteScroll) {
        this.chatUserSelectionComponent.infiniteScroll.disabled = true;
      }
    }, 100);
  }

  onCloseModal(): void {
    this.closeModal?.();
  }
}
