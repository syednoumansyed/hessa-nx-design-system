import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiUrl } from '@shared/utils/api-url.util';
import { IResponse } from '@shared/interfaces';
import { SupportCategoryDTO } from './support-category.dto';
import {
  SupportCategory,
  SupportSubcategory,
} from './support-category.interface';
import { SUPPORT_CATEGORY_DTO_TRANSFORM } from './support-category-dto-transform';
import { SupportCustomFieldListResponseDTO } from './support-custom-field.dto';
import { SupportCustomField } from './support-custom-field.interface';
import { createSupportCustomFieldDtoTransform } from './support-custom-field-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class SupportHubCategoriesService {
  private readonly http = inject(HttpClient);
  private readonly customFieldTransform =
    createSupportCustomFieldDtoTransform();

  // Categories (support types)
  private readonly _categories = signal<SupportCategory[]>([]);
  readonly categories = this._categories.asReadonly();

  // Subcategories for selected category
  private readonly _subcategories = signal<SupportSubcategory[]>([]);
  readonly subcategories = this._subcategories.asReadonly();

  // Custom fields for selected category
  private readonly _customFields = signal<SupportCustomField[]>([]);
  readonly customFields = this._customFields.asReadonly();

  private readonly _categoriesLoading = signal(false);
  readonly categoriesLoading = this._categoriesLoading.asReadonly();

  private readonly _subcategoriesLoading = signal(false);
  readonly subcategoriesLoading = this._subcategoriesLoading.asReadonly();

  private readonly _customFieldsLoading = signal(false);
  readonly customFieldsLoading = this._customFieldsLoading.asReadonly();

  private readonly _error = signal<Error | null>(null);
  readonly error = this._error.asReadonly();

  readonly categoriesForDisplay = computed(() => this._categories());
  readonly subcategoriesForDisplay = computed(() => this._subcategories());
  readonly customFieldsForDisplay = computed(() => this._customFields());

  /**
   * Fetch categories (support types) from the API.
   * Only includes categories where isForTicket is true.
   */
  loadCategories(): Observable<SupportCategory[]> {
    this._categoriesLoading.set(true);
    this._error.set(null);

    return this.http
      .get<IResponse<SupportCategoryDTO[]>>(`${ApiUrl.v1BE}/tickets/types`)
      .pipe(
        map((response) => {
          const transformedCategories =
            SUPPORT_CATEGORY_DTO_TRANSFORM.supportCategories(response.data);
          this._categories.set(transformedCategories);
          this._categoriesLoading.set(false);
          return transformedCategories;
        }),
      );
  }

  /**
   * Fetch subcategories for a specific category (support type).
   * @param supportTypeId - The ID of the support type/category
   */
  loadSubcategories(supportTypeId: number): Observable<SupportSubcategory[]> {
    this._subcategoriesLoading.set(true);
    this._error.set(null);

    return this.http
      .get<IResponse<SupportCategoryDTO[]>>(
        `${ApiUrl.v1BE}/tickets/categories`,
        {
          params: {
            supportTypeId: supportTypeId.toString(),
          },
        },
      )
      .pipe(
        map((response) => {
          const transformedSubcategories =
            SUPPORT_CATEGORY_DTO_TRANSFORM.supportSubcategories(response.data);
          this._subcategories.set(transformedSubcategories);
          this._subcategoriesLoading.set(false);
          return transformedSubcategories;
        }),
      );
  }

  /**
   * Reset categories and clear error state.
   */
  resetCategories(error?: Error): void {
    if (error) {
      this._error.set(error);
    }
    this._categories.set([]);
    this._categoriesLoading.set(false);
  }

  /**
   * Reset subcategories and clear error state.
   */
  resetSubcategories(error?: Error): void {
    if (error) {
      this._error.set(error);
    }
    this._subcategories.set([]);
    this._subcategoriesLoading.set(false);
  }

  /**
   * Fetch custom fields for a specific category (support type).
   * @param supportTypeId - The ID of the support type/category
   */
  loadCustomFields(supportTypeId: number): Observable<SupportCustomField[]> {
    this._customFieldsLoading.set(true);
    this._error.set(null);

    return this.http
      .get<SupportCustomFieldListResponseDTO>(
        `${ApiUrl.v2BE}/custom-fields/support-type/${supportTypeId}`,
      )
      .pipe(
        map((response) => {
          const transformedCustomFields =
            this.customFieldTransform.customFields(response.data);
          this._customFields.set(transformedCustomFields);
          this._customFieldsLoading.set(false);
          return transformedCustomFields;
        }),
      );
  }

  /**
   * Reset custom fields and clear error state.
   */
  resetCustomFields(error?: Error): void {
    if (error) {
      this._error.set(error);
    }
    this._customFields.set([]);
    this._customFieldsLoading.set(false);
  }
}
