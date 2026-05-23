import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import {
  IAnnouncementPostAuthor,
  ISchoolEntity,
  PostAuthorDetailsDTO,
} from '@pages/announcements/data-access/post.dto';
import { DEFAULT_PARAM } from '@shared/constants/default-page-param.constant';
import { IPaginatedResponse, IPagination, IResponse } from '@shared/interfaces';
import { ANNOUNCEMENTS_MAP_FROM_DTO } from '@shared/interfaces/announcements-dto-transform';
import { AnnouncementDTO } from '@shared/interfaces/announcements.dto';
import {
  Announcement,
  IAnnouncementListItem,
  IAnnouncementQueryParams,
} from '@shared/interfaces/announcements.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { catchError, map, Observable, throwError } from 'rxjs';
import { PostAuthorDetail } from './data-access/post.interface';
import { ANOUNCEMENT_POST_MAP_FROM_DTO } from './data-access/post-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsService {
  private _announcementsList = signal<IAnnouncementListItem[]>([]);
  readonly announcementsList = this._announcementsList.asReadonly();
  private _announcementAuthorInfo = signal<IAnnouncementPostAuthor | null>(
    null,
  );
  readonly announcementAuthorInfo = this._announcementAuthorInfo.asReadonly();
  private _announcementsPagination = signal<IPagination | null>(null);
  readonly announcementsPagination = this._announcementsPagination.asReadonly();

  constructor(private http: HttpClient) {}

  deleteAnnouncement(id: number, type: string) {
    return this.http.delete(`${ApiUrl.v1BE}/announcements/${type}/${id}`);
  }

  getAnnouncementPostAuthorDetails(postId: number) {
    return this.http
      .get<
        IResponse<PostAuthorDetailsDTO>
      >(`${ApiUrl.v1BE}/announcements/author/${postId}`)
      .pipe(
        map((res) => {
          const mapData = ANOUNCEMENT_POST_MAP_FROM_DTO.authorDetails(res.data);
          this._announcementAuthorInfo.set(this.mapAuthorInfo(mapData));
          return mapData;
        }),
        catchError((err) => {
          this._announcementAuthorInfo.set(null);
          return throwError(() => new Error(err));
        }),
      );
  }

  resetAuthorInfo() {
    this._announcementAuthorInfo.set(null);
  }

  private mapAuthorInfo(author: PostAuthorDetail): IAnnouncementPostAuthor {
    let school: ISchoolEntity[] = [];
    let campus: ISchoolEntity[] = [];
    let company: ISchoolEntity[] = [];
    if (author.schoolStructure) {
      const { schools, campuses, companies } = author.schoolStructure;
      const mapStructure = (entities: any[]) =>
        Array.isArray(entities)
          ? entities.map((structure) => ({
              id: structure.id,
              name: structure.name,
            }))
          : [];

      school = mapStructure(schools);
      campus = mapStructure(campuses);
      company = mapStructure(companies);

      school = this.removeDuplicates(school, 'id');
      campus = this.removeDuplicates(campus, 'id');
      company = this.removeDuplicates(company, 'id');
    }
    return {
      userId: author.userId,
      fullName: author.displayName,
      email: author.email,
      phoneNumber: author.phoneNumber,
      gender: author.gender,
      profileColor: author.profileColor,
      countryCode: author.countryCode,
      schoolStructure: {
        school,
        campus,
        company,
      },
      nationalId: author.nationalId,
      personnelId: author.personnelId,
      role: author.roles.map((r) => r.displayName).join(', '),
    };
  }

  removeDuplicates<T>(arr: T[], key: keyof T): T[] {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
  }

  getAnnouncements(
    params?: IAnnouncementQueryParams,
  ): Observable<Announcement[]> {
    return this.http
      .get<IPaginatedResponse<AnnouncementDTO[]>>(
        `${ApiUrl.v1BE}/announcements`,
        {
          params: {
            ...DEFAULT_PARAM,
            ...params,
          },
        },
      )
      .pipe(
        map((res) => {
          const mapData = ANNOUNCEMENTS_MAP_FROM_DTO.announcements(res.data);
          this._announcementsList.set(
            this.mapAnnouncementsToAnnouncementListItems(mapData),
          );
          this._announcementsPagination.set(res.paginate);
          return mapData;
        }),
        catchError((err) => {
          this._announcementsList.set([]);
          this._announcementsPagination.set(err.error.paginate);
          return throwError(() => new Error(err));
        }),
      );
  }

  mapAnnouncementsToAnnouncementListItems(
    announcements: Announcement[],
  ): IAnnouncementListItem[] {
    return announcements.map((announcement) => {
      return {
        ...announcement,
        type: announcement.type,
        content: announcement.content,
        targetRoles: announcement.targetRoles
          .map((role) => role.displayName)
          .join(', '),
        targetSchools: announcement.targets
          .map((target) => target.displayName)
          .join(', '),
        createdBy: announcement.createdBy.displayName,
        actions: [],
      };
    });
  }
}
