import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import {
  DsStudentSelectorComponent,
  Student,
} from '@ds/student-selector/student-selector.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { isMobile } from '@shared/utils/platform';
import { ChatUserPreviewComponent } from '../chat-user-preview/chat-user-preview.component';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { ChatPersonnel } from '@pages/chat/data-access/chat.interface';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import { AuthService } from '@auth/auth.service';
import { ConversationType } from '@shared/enums';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';

@Component({
  selector: 'app-start-chat-as-guardian',
  templateUrl: './start-chat-as-guardian.component.html',
  standalone: true,
  imports: [
    CommonModule,
    DsStudentSelectorComponent,
    TranslocoDirective,
    ChatUserPreviewComponent,
    SearchBoxComponent,
    NoDataCardComponent,
  ],
})
export class StartChatAsGuardianComponent implements OnInit {
  private readonly hesToasterService = inject(HesToasterService);
  private readonly studentSelectionScope = inject(StudentSelectionScopeService);
  private readonly chatService = inject(ChatService);
  private readonly auth = inject(AuthService);

  closeModal?: (data?: unknown, role?: string) => void;

  personnelsList = signal<Array<any>>([]);
  allPersonnelsList = signal<Array<ChatPersonnel>>([]);
  selectedStudentId = signal<string>('0');
  searchTerm = signal<string>('');
  noSearchResults = signal<boolean>(false);

  isMobile = isMobile();

  isGuardianUser = computed(() => this.auth.user()?.type === 'GUARDIAN');

  // Computed property for filtered teachers based on search term
  filteredPersonnelsList = computed(() => {
    const searchTerm = this.searchTerm().toLowerCase().trim();
    if (!searchTerm) {
      return this.getTeachersForTemplate();
    }

    return this.allPersonnelsList()
      .filter((personnel) => {
        // Search in displayName
        const displayNameMatch = personnel.displayName
          ?.toLowerCase()
          .includes(searchTerm);

        // Search in subject names from subjects array
        const subjectMatch = personnel.subjects?.some((subject) =>
          subject.displayName?.toLowerCase().includes(searchTerm),
        );

        return displayNameMatch || subjectMatch;
      })
      .map((personnel) => this.adaptTeacherForTemplate(personnel));
  });

  // Computed property to get teachers adapted for template
  getTeachersForTemplate = computed(() => {
    return this.allPersonnelsList().map((personnel) =>
      this.adaptTeacherForTemplate(personnel),
    );
  });

  ngOnInit() {
    // If there's only one student, automatically select it
    const students = this.studentsOptions();
    if (students.length === 1) {
      this.selectedStudentId.set(students[0].id);
    }
    this.fetchPersonnels();
  }

  studentsOptions = computed(() => {
    return this.studentSelectionScope.studentSelectionScope().map((s) => ({
      id: s.id.toString(),
      fullName: s.fullName,
      class: s?.school?.class?.displayName || '',
      level: s?.school?.level?.displayName || '',
      imageUrl: s?.image || '',
    }));
  });

  // Check if we need to show the student selector (more than 1 student available)
  shouldShowStudentSelector = computed(() => {
    return this.studentsOptions().length > 1;
  });

  onStudentChange(student?: Student): void {
    this.noSearchResults.set(false);
    if (!student) return;
    this.selectedStudentId.set(student.id);
    this.fetchPersonnels();
    // Reapply search filter after fetching new teachers
    setTimeout(() => {
      const currentSearch = this.searchTerm();
      if (currentSearch) {
        this.personnelsList.set(this.filteredPersonnelsList());
      } else {
        this.personnelsList.set(this.getTeachersForTemplate());
      }
    });
  }

  // Adapter method to convert ChatPersonnel to format expected by template
  private adaptTeacherForTemplate(personnel: ChatPersonnel) {
    // Use subjects if available, otherwise fall back to roles
    const tags = personnel.subjects?.length
      ? personnel.subjects.map((subject) => ({
          name: subject.displayName,
          color: personnel.profileColor,
        }))
      : personnel.roles?.map((role) => ({
          name: role.displayName,
          color: personnel.profileColor,
        })) || [];

    // Show student names only for guardians when there are no subjects
    const studentNames =
      this.isGuardianUser() && personnel.subjects?.length
        ? personnel.students?.map((student) => student.displayName) || []
        : [];

    return {
      ...personnel,
      displayName: personnel.displayName,
      profileColor: personnel.profileColor,
      tags,
      studentNames,
    };
  }

  fetchPersonnels() {
    let params = {};
    if (this.selectedStudentId() !== '0') {
      params = { studentId: this.selectedStudentId() };
    }
    this.chatService.getPersonnelsList(params).subscribe((res) => {
      this.allPersonnelsList.set(res.data);
      this.personnelsList.set(this.getTeachersForTemplate());
    });
  }

  onTeacherClick(adaptedTeacher: any) {
    // Find the original ChatPersonnel from allPersonnelsList
    const personnel = this.allPersonnelsList().find(
      (t) => t.id === adaptedTeacher.id,
    );
    if (!personnel) return;

    const chatUid: string = personnel.chatId;

    this.chatService
      .getCometChatUser(chatUid)
      .then(async (abc) => {
        this.onCloseModal();
        this.handleChatSelection(personnel);
      })
      .catch((error) => {
        if (error.code === 'ERR_UID_NOT_FOUND') {
          this.handleNewChatCreation(personnel);
        } else {
          this.hesToasterService.error(error.message);
        }
      });
  }

  private handleNewChatCreation(personnel: ChatPersonnel) {
    const user = new CometChat.User(personnel.chatId);
    user.setName(personnel.displayName);
    user.setRole('personnel');
    this.chatService
      .registerUserToCometChat(user)
      .then(() => {
        this.handleChatSelection(personnel);
      })
      .catch((error) => {
        this.hesToasterService.error(error.message);
      });
  }

  private handleChatSelection(personnel: ChatPersonnel) {
    this.chatService.getChatMetaData(personnel.chatId).subscribe({
      next: (chatsMetadata) => {
        if (chatsMetadata && chatsMetadata.length > 0) {
          const metadata = chatsMetadata[0];
          this.chatService.setSelectedChat({
            id: personnel.chatId,
            displayName: metadata.displayName || personnel.displayName,
            type: ConversationType.USER,
            metadata: metadata,
          });
          this.onCloseModal();
        }
      },
      error: (error) => {
        console.error('Error fetching chat metadata:', error);
      },
    });
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    this.personnelsList.set(this.filteredPersonnelsList());
    this.noSearchResults.set(this.personnelsList().length === 0);
  }

  onCloseModal(): void {
    this.closeModal?.();
  }
}
