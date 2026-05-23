import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { FileUploadService } from '@shared/services/file-upload.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { StructureDepth } from '@shared/utils/school-structure';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { SchoolStructureControlItem } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { map, Observable } from 'rxjs';
import {
  AnnouncementRolesResponseDTO,
  AnnouncementUserQueryParams,
  AnnouncementUserResponseDTO,
  CountByRoleResponseDTO,
  GetSMSCostDTO,
  PostAnnouncementUnreadCountsResponseDTO,
  PostPayload,
  PostResponseDTO,
  SchoolSctructureEntityDTO,
  UserFeedPayload,
  ViewPostsResponseDTO,
} from './post.dto';
import {
  AnnouncementRoleResponse,
  AnnouncementUserResponse,
  SchoolSctructureEntity,
  UserFeedResponse,
} from './post.interface';
import { ANOUNCEMENT_POST_MAP_FROM_DTO } from './post-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private readonly http = inject(HttpClient);
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly fileUploadService = inject(FileUploadService);

  private _postAnnoucementsUnreadCounts = signal<number>(0);
  readonly postAnnoucementsUnreadCounts =
    this._postAnnoucementsUnreadCounts.asReadonly();

  fetchUserFeeds(params: UserFeedPayload): Observable<UserFeedResponse> {
    return this.http
      .get<ViewPostsResponseDTO>(`${ApiUrl.v2BE}/announcements/user-feed`, {
        params,
      })
      .pipe(
        map((res) => {
          return {
            ...res,
            data: ANOUNCEMENT_POST_MAP_FROM_DTO.userFeedPosts(res.data),
          };
        }),
      );
  }

  viewPost(id: number) {
    return this.http.post(`${ApiUrl.v2BE}/announcements/views`, {
      announcementIds: [id],
    });
  }

  upload(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadMediaFiles({
      uploadUrlConfig: {
        video: {
          url: `${ApiUrl.v1BE}/announcements/video/upload`,
          uploadAsFormData: true,
        },
        file: {
          url: `${ApiUrl.v1BE}/announcements/file/upload`,
        },
      },
      attachments,
    });
  }

  private base64WithoutPrefix(base64String: string) {
    return base64String.split(',')[1];
  }

  deleteImage(key: string) {
    return this.http.delete(`${ApiUrl.v1BE}/announcements/file/delete/${key}`);
  }

  sendTestSMS(content: string): Observable<void> {
    return this.http.post<void>(`${ApiUrl.v1BE}/announcements/sms/test`, {
      content,
    });
  }
  createPost(data: PostPayload) {
    return this.http.post(`${ApiUrl.v1BE}/announcements/${data.type}`, data);
  }

  updatePost(id: number, data: PostPayload) {
    return this.http.put(
      `${ApiUrl.v1BE}/announcements/${data.type}/${id}`,
      data,
    );
  }

  getPostById(id: number, type: 'notification' | 'sms' | 'post') {
    return this.http.get<PostResponseDTO>(
      `${ApiUrl.v1BE}/announcements/${type}/${id}`,
    );
  }

  getSchoolStructure() {
    const data =
      this.schoolStructureScope.getUserScopedSchoolStructureTillDepth(
        StructureDepth.CLASS,
      ) as unknown as SchoolStructureControlItem[];
    this.addParentRef(data);
    return data;
  }

  getCountByRole(args: {
    targets: Array<SchoolSctructureEntity>;
    roleIds: number[];
    academicYearId?: number;
  }): Observable<CountByRoleResponseDTO['data']> {
    return this.http
      .post<CountByRoleResponseDTO>(
        `${ApiUrl.v1BE}/announcements/user-counts-by-roles`,
        {
          ...args,
        },
      )
      .pipe(map((res) => res.data));
  }

  getSMSCost(params: {
    messageCount: number;
    userCount: number;
  }): Observable<GetSMSCostDTO['data']> {
    return this.http
      .get<GetSMSCostDTO>(`${ApiUrl.v1BE}/announcements/sms/cost`, {
        params,
      })
      .pipe(map((res) => res.data));
  }

  getAnouncementUsers(
    params: AnnouncementUserQueryParams,
  ): Observable<AnnouncementUserResponse> {
    return this.http
      .post<AnnouncementUserResponseDTO>(`${ApiUrl.v1BE}/announcements/users`, {
        ...params,
      })
      .pipe(
        map((res) => {
          return {
            ...res,
            data: ANOUNCEMENT_POST_MAP_FROM_DTO.announcementUsers(res.data),
          };
        }),
      );
  }

  private getValidName(name: string) {
    return name?.replace(/[^a-zA-Z0-9.]/g, '')?.replace(/(?!.*\.)(\.)/g, '');
  }

  private addParentRef(
    nodes: SchoolStructureControlItem[],
    parent: SchoolStructureControlItem | null = null,
  ) {
    nodes.forEach((node) => {
      if (parent !== null) {
        node.parent = parent;
      }
      if (node.children) {
        this.addParentRef(node.children, node);
      }
    });
  }

  getPostRoles(): Observable<AnnouncementRoleResponse> {
    return this.http
      .get<AnnouncementRolesResponseDTO>(
        `${ApiUrl.v2BE}/announcements/post/roles`,
      )
      .pipe(
        map((res) => {
          return {
            ...res,
            data: ANOUNCEMENT_POST_MAP_FROM_DTO.announcementRoles(res.data),
          };
        }),
      );
  }

  getNotificationRoles(): Observable<AnnouncementRoleResponse> {
    return this.http
      .get<AnnouncementRolesResponseDTO>(
        `${ApiUrl.v2BE}/announcements/notification/roles`,
      )
      .pipe(
        map((res) => {
          return {
            ...res,
            data: ANOUNCEMENT_POST_MAP_FROM_DTO.announcementRoles(res.data),
          };
        }),
      );
  }

  getSMSRoles(): Observable<AnnouncementRoleResponse> {
    return this.http
      .get<AnnouncementRolesResponseDTO>(
        `${ApiUrl.v2BE}/announcements/sms/roles`,
      )
      .pipe(
        map((res) => {
          return {
            ...res,
            data: ANOUNCEMENT_POST_MAP_FROM_DTO.announcementRoles(res.data),
          };
        }),
      );
  }
}
