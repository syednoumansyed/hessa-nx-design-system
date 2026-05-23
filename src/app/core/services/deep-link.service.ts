import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ConversationType, NotificationDestination } from '@shared/enums';

// Move type definitions outside the decorator
export interface DeepLinkResult {
  route: string;
  params?: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class DeepLinkService {
  private router = inject(Router);
  constructor() {}

  /**
   * Single method to handle all notification destinations
   * The destination enum already contains the role suffix (_STUDENT, _GUARDIAN, _PERSONNEL)
   */
  handleNotificationClick(
    destination: NotificationDestination,
    metadata: Record<string, any>,
  ): DeepLinkResult {
    switch (destination) {
      // Course related
      case NotificationDestination.COURSE_CONTENT_LIST_STUDENT:
        return { route: `/lms/courses` };

      case NotificationDestination.COURSE_CONTENT_EXAM_DETAILS_STUDENT:
      case NotificationDestination.COURSE_CONTENT_EXAM_DETAILS_GUARDIAN:
        return {
          route: `/lms/course/${metadata['courseId']}/exam/${metadata['examId']}`,
          params: {
            examId: metadata['examId'],
            courseId: metadata['courseId'],
            selectedStudentId: metadata['studentId'],
          },
        };

      // Attendance
      case NotificationDestination.ATTENDANCE_VIEW_STUDENT:
      case NotificationDestination.ATTENDANCE_VIEW_GUARDIAN: {
        const studentId = metadata['studentId'];
        return {
          route: `/attendance/monthly-detail`,
          params: studentId ? { selectedStudentId: studentId } : undefined,
        };
      }

      // VCR
      case NotificationDestination.VCR_LIST_STUDENT:
      case NotificationDestination.VCR_LIST_PERSONNEL:
        return {
          route: `/vcr/${metadata['virtualClassroomId']}`,
        };

      // Feed
      case NotificationDestination.ANNOUNCEMENT_USER_FEED_STUDENT:
      case NotificationDestination.ANNOUNCEMENT_USER_FEED_GUARDIAN:
      case NotificationDestination.ANNOUNCEMENT_USER_FEED_PERSONNEL:
        return { route: `/home` };

      // Announcements
      case NotificationDestination.PUSH_ANNOUNCEMENT_CREATED:
        return { route: `/home` }; //todo: Shahid will update notification page url

      // Announcements
      case NotificationDestination.POST_ANNOUNCEMENT_CREATED:
        return { route: `/home` };

      // Support Tickets
      case NotificationDestination.SUPPORT_TICKET_INITIATOR_DETAILS_GUARDIAN:
      case NotificationDestination.SUPPORT_TICKET_INITIATOR_DETAILS_STUDENT:
      case NotificationDestination.SUPPORT_TICKET_INITIATOR_DETAILS_PERSONNEL:
      case NotificationDestination.SUPPORT_TICKET_ASSIGNEE_DETAILS_PERSONNEL:
        return {
          route: `/support-hub`,
          params: metadata['ticketId']
            ? { ticketId: metadata['ticketId'] }
            : undefined,
        };

      // Grades
      case NotificationDestination.GRADE_MANAGEMENT_VIEW_STUDENT:
      case NotificationDestination.GRADE_MANAGEMENT_VIEW_GUARDIAN: {
        const studentId = metadata['studentId'];
        return {
          route: `/report-card`,
          params: studentId ? { selectedStudentId: studentId } : undefined,
        };
      }

      case NotificationDestination.GRADE_MANAGEMENT_ENTRIES_PERSONNEL: {
        const { reportCardId, classId, subjectId } = metadata;
        if (reportCardId && classId && subjectId) {
          return {
            route: `/grade-management/list-courses/${reportCardId}/${classId}/${subjectId}`,
            params: {
              reportCardId,
              classId,
              subjectId,
            },
          };
        } else {
          return {
            route: `/grade-management/list-courses/`,
          };
        }
      }

      // Chats
      case NotificationDestination.CHATS_DETAILS_GUARDIAN:
      case NotificationDestination.CHATS_DETAILS_PERSONNEL:
      case NotificationDestination.CHATS_DETAILS_STUDENT:
        const chatMetadata: any = metadata;
        const chatId =
          chatMetadata.receiverType === ConversationType.GROUP
            ? chatMetadata.receiver
            : chatMetadata.sender;

        return {
          route: `/chat`,
          params: {
            chatId: chatId,
            conversationType: chatMetadata.receiverType,
          },
        };

      // Journal (Guardian only)
      case NotificationDestination.JOURNAL_DETAILS_GUARDIAN:
        return {
          route: `/journal/view/${metadata['journalId']}`,
          params: { journalId: metadata['journalId'] },
        };

      // Pickup (Guardian only)
      case NotificationDestination.PICKUP_LIST_GUARDIAN:
        return { route: `/pickup` };

      // Pickup (Personnel only)
      case NotificationDestination.PICKUP_LIST_PERSONNEL:
        return { route: `/pickup/personnel-request` };

      // Reports (Personnel only)
      case NotificationDestination.REPORTS_HISTORY_PERSONNEL:
        return { route: `/reports` };

      // Default fallback
      default:
        console.warn(`Unknown notification destination: ${destination}`);
        return { route: `/notifications` };
    }
  }

  /**
   * This method is used to navigate to the destination specified in the deep link.
   * @param deepLink
   */
  navigateToDestination(deepLink: DeepLinkResult) {
    this.router.navigate([deepLink.route], { queryParams: deepLink.params });
  }
}
