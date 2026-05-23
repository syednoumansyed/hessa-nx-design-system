import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import {
  CategoriesDetailDTOResponse,
  SupportType,
  CreateSupportTypePayload,
  CreateSupportTypeRequestDTO,
  FetchCategoriesParams,
  NewCustomFieldRequestDTO,
  SubCategoryDetail,
  SubCategoryDetailDTOResponse,
  SubCategoryListParams,
  SubCategoryRequest,
  TICKET_MAP_FROM_DTO,
  SupportTypeDTOResponse,
} from '@shared/dto-transformation';
import { IPaginatedResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TicketTypeService {
  private readonly http = inject(HttpClient);

  constructor() {}

  fetchCategories(params: FetchCategoriesParams): Observable<SupportType[]> {
    return this.http
      .get<CategoriesDetailDTOResponse>(`${ApiUrl.v1BE}/support-types`, {
        params,
      })
      .pipe(
        map((resp) => {
          return TICKET_MAP_FROM_DTO.supportTypes(resp.data);
        }),
      );
  }

  addCategory(payload: CreateSupportTypePayload): Observable<unknown> {
    const dto = this.mapToSupportTypeDTO(payload);
    return this.http.post(`${ApiUrl.v1BE}/support-types`, dto);
  }

  editCategory(
    id: ObjId,
    payload: CreateSupportTypePayload,
  ): Observable<unknown> {
    const dto = this.mapToSupportTypeDTO(payload);
    return this.http.put(`${ApiUrl.v1BE}/support-types/${id}`, dto);
  }

  private mapToSupportTypeDTO(
    payload: CreateSupportTypePayload,
  ): CreateSupportTypeRequestDTO {
    const newCustomFields: NewCustomFieldRequestDTO[] | undefined =
      payload.newCustomFields?.map((cf) => ({
        arLabel: cf.arLabel,
        enLabel: cf.enLabel,
        arDescription: cf.arDescription,
        enDescription: cf.enDescription,
        required: cf.required,
      }));

    return {
      icon: payload.icon,
      arName: payload.arName,
      enName: payload.enName,
      arDescription: payload.arDescription || null,
      enDescription: payload.enDescription || null,
      accessLevel: payload.accessLevel,
      allowPrivateRequest: payload.allowPrivateRequest,
      isForArticle: payload.isForArticle,
      isForTicket: payload.isForTicket,
      customFieldIds: payload.customFieldIds,
      newCustomFields,
    };
  }

  deleteCategory(id: ObjId) {
    return this.http.delete(`${ApiUrl.v1BE}/support-types/${id}`);
  }

  fetchCategory(id: ObjId): Observable<SupportType> {
    return this.http
      .get<SupportTypeDTOResponse>(`${ApiUrl.v1BE}/support-types/${id}`)
      .pipe(map((resp) => TICKET_MAP_FROM_DTO.supportType(resp.data)));
  }

  fetchSubCategories(
    params: SubCategoryListParams,
  ): Observable<IPaginatedResponse<SubCategoryDetail[]>> {
    return this.http
      .get<SubCategoryDetailDTOResponse>(`${ApiUrl.v1BE}/support-categories`, {
        params,
      })
      .pipe(
        map((resp) => {
          return {
            ...resp,
            data: resp.data.map((item) =>
              TICKET_MAP_FROM_DTO.subCategory(item),
            ),
          };
        }),
      );
  }

  fetchArticleCategories(
    params?: FetchCategoriesParams,
  ): Observable<IPaginatedResponse<SubCategoryDetail[]>> {
    return this.http
      .get<SubCategoryDetailDTOResponse>(`${ApiUrl.v1BE}/articles/categories`, {
        params,
      })
      .pipe(
        map((resp) => {
          return {
            ...resp,
            data: TICKET_MAP_FROM_DTO.subCategories(resp.data),
          };
        }),
      );
  }

  fetchSubCatgories(
    params: SubCategoryListParams,
  ): Observable<IPaginatedResponse<SubCategoryDetail[]>> {
    return this.http
      .get<SubCategoryDetailDTOResponse>(`${ApiUrl.v1BE}/support-categories`, {
        params,
      })
      .pipe(
        map((resp) => {
          return {
            ...resp,
            data: TICKET_MAP_FROM_DTO.subCategories(resp.data),
          };
        }),
      );
  }

  getArticleCategoriesSelectValue(): Observable<ISelectValue[]> {
    return this.fetchArticleCategories().pipe(
      map((types) => {
        return types.data.map((type) => {
          return {
            displayedValue: type.displayName,
            value: type.id,
          };
        });
      }),
    );
  }

  addSubCategory(params: SubCategoryRequest) {
    return this.http.post(`${ApiUrl.v1BE}/support-categories`, params); //check the link
  }

  editSubCategory(id: ObjId, params: SubCategoryRequest) {
    return this.http.put(`${ApiUrl.v1BE}/support-categories/${id}`, params); //check the link
  }

  deleteSubCategory(id: ObjId) {
    return this.http.delete(`${ApiUrl.v1BE}/support-categories/${id}`, {
      params: {
        id: id,
      },
    });
  }
}
