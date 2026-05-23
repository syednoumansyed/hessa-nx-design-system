import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';

@Injectable({
  providedIn: 'root',
})
export class UnreadNotificationService {
  // #region Properties

  private readonly http = inject(HttpClient);

  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );

  // Signal to store the unread notification count (or null if not loaded)
  private readonly _unReadNotificationsCount =
    signal<UnreadNotification | null>(null);

  // Expose the readonly version of unread notifications count
  public readonly unReadNotificationsCount =
    this._unReadNotificationsCount.asReadonly();

  // #endregion

  // #region Methods

  // Load unread notifications for the selected academic year
  loadUnreadForSelectedAcademicYear(): void {
    this.loadUnread(this.academicYearsScopeService.selectedAcademicYear()?.id);
  }

  // Load unread notifications based on the academic year ID
  loadUnread(academicYearId?: number | string): void {
    this.http
      .get<UnreadNotificationDto>(`${ApiUrl.v1BE}/notifications/unread`, {
        // Add academicYearId to params if it exists
        params: {
          ...(academicYearId && { academicYearId: academicYearId?.toString() }),
        },
      })
      .subscribe((response) => {
        // Update signal with the new unread notification data
        this._unReadNotificationsCount.set(response.data);
      });
  }

  // #endregion
}

// #region Interfaces

// Interface representing unread notification counts for different categories
export interface UnreadNotification {
  announcements: {
    unreadCounts: number;
  };
  tickets: {
    initiatorUnreadCounts: number;
    assigneeUnreadCounts: number;
  };
}

// Type for response data with the structure of UnreadNotification
type UnreadNotificationDto = IResponse<UnreadNotification>;

// #endregion
