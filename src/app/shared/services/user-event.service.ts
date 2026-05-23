import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';
import { ObjId } from '@shared/interfaces/common.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Observable, Subject, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserEventService {
  // #region private properties
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly courseUpdated = new Subject<boolean>();
  // #endregion
  courseUpdated$ = this.courseUpdated.asObservable();

  // #region Public Methods
  fireAttachmentEvent(
    entityId: EntityId,
    topicId: EntityId,
    config: UserEventConfig = {},
  ): Observable<void> {
    return this.postUserEvent(
      {
        topicId: topicId,
        eventType: UserEventTypes.ATTACHMENT_DOWNLOADED,
        entityId,
      },
      config,
    );
  }

  markCourseAsUpdated(): void {
    this.courseUpdated.next(true);
  }

  fireVideoEvent(
    entityId: EntityId,
    topicId: EntityId,
    config: UserEventConfig = {},
  ): Observable<void> {
    return this.postUserEvent(
      {
        topicId: topicId,
        eventType: UserEventTypes.VIDEO_PLAYED,
        entityId,
      },
      config,
    );
  }

  fireDisplayEvent(
    entityId: EntityId,
    topicId: EntityId,
    eventType: UserEventTypes,
    config: UserEventConfig = {},
  ): Observable<void> {
    return this.postUserEvent(
      {
        topicId: topicId,
        eventType: eventType,
        entityId,
      },
      config,
    );
  }

  fireQuestionDisplayedEvent(
    entityId: EntityId,
    config: UserEventConfig = {},
  ): Observable<void> {
    return this.postUserEvent(
      {
        eventType: UserEventTypes.QUESTION_DISPLAYED,
        entityId,
      },
      config,
    );
  }
  // #endregion

  // #region Private Methods
  private postUserEvent(
    userEvent: UserEvent,
    config: UserEventConfig = {},
  ): Observable<void> {
    const subject = new Subject<void>();
    // Extract configuration with defaults
    const { version = ApiVersion.V1, allowedUserTypes = [UserType.STUDENT] } =
      config;

    const currentUserType = this.authService.user()?.type;
    if (!currentUserType || !allowedUserTypes.includes(currentUserType)) {
      subject.complete();
      return subject.asObservable();
    }

    const payload = {
      ...userEvent,
      entityId: userEvent.entityId?.toString(),
    };

    // Get API URL based on version
    const apiUrl = this.getApiUrlByVersion(version);

    this.http.post(`${apiUrl}/user-events/`, payload).subscribe({
      next: () => {
        this.courseUpdated.next(true);
        subject.next();
        subject.complete();
      },
      error: () => {
        subject.complete();
      },
    });
    return subject.asObservable().pipe(take(1));
  }

  /**
   * Maps API version enum to actual API URL
   */
  private getApiUrlByVersion(version: ApiVersion): string {
    switch (version) {
      case ApiVersion.V1:
        return ApiUrl.v1BE;
      case ApiVersion.V2:
        return ApiUrl.v2BE;
      default:
        return ApiUrl.v1BE; // Default fallback
    }
  }
  // #endregion
}

// #region Enums and Types
export enum UserEventTypes {
  VIDEO_PLAYED = 'VIDEO_PLAYED',
  ATTACHMENT_DOWNLOADED = 'ATTACHMENT_DOWNLOADED',
  EXAM_SUBMITTED = 'EXAM_SUBMITTED',
  EXAM_DISPLAYED = 'EXAM_DISPLAYED',
  ASSIGNMENT_DISPLAYED = 'ASSIGNMENT_DISPLAYED',
  VIDEO_DISPLAYED = 'VIDEO_DISPLAYED',
  ATTACHMENT_DISPLAYED = 'ATTACHMENT_DISPLAYED',
  QUESTION_DISPLAYED = 'QUESTION_DISPLAYED',
}

export enum ApiVersion {
  V1 = 'v1',
  V2 = 'v2',
}

interface UserEvent {
  readonly eventType: UserEventTypes;
  readonly topicId?: EntityId; // Course ID
  readonly entityId: EntityId; // Video or Attachment ID
  readonly studentId?: EntityId;
}

export interface UserEventConfig {
  readonly version?: ApiVersion; // Optional, defaults to V1
  readonly allowedUserTypes?: UserType[]; // Optional, defaults to [STUDENT]
}

type EntityId = string | number;
// #endregion
