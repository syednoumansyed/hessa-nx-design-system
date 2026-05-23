import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  CustomFieldListResponseDTO,
  CreateCustomFieldDTO,
} from './custom-field.dto';
import {
  CreateCustomFieldPayload,
  CustomField,
} from './custom-field.interface';
import { CUSTOM_FIELD_MAP_FROM_DTO } from './custom-field-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class CustomFieldService {
  private http = inject(HttpClient);

  private readonly customFields = signal<CustomField[]>([]);

  /**
   * Fetch custom fields from API
   * Fetches 1000 items to avoid pagination (local search is used)
   */
  fetchCustomFields(): Observable<CustomField[]> {
    return this.http
      .get<CustomFieldListResponseDTO>(`${ApiUrl.v2BE}/custom-fields`, {
        params: {
          itemsPerPage: 1000,
        },
      })
      .pipe(
        map((res) => CUSTOM_FIELD_MAP_FROM_DTO.customFields(res.data)),
        tap((fields) => {
          this.customFields.set(fields);
        }),
      );
  }

  /**
   * Get cached custom fields
   */
  getCustomFields(): CustomField[] {
    return this.customFields();
  }

  /**
   * Search custom fields locally by label
   */
  searchCustomFields(query: string): CustomField[] {
    if (!query.trim()) {
      return this.customFields();
    }
    return this.customFields().filter((f) =>
      f.labelDisplayName.toLowerCase().includes(query.toLowerCase()),
    );
  }

  /**
   * Create a new custom field
   */
  createCustomField(payload: CreateCustomFieldPayload): Observable<any> {
    const dto: CreateCustomFieldDTO = {
      arLabel: payload.arLabel,
      enLabel: payload.enLabel,
      arDescription: payload.arDescription,
      enDescription: payload.enDescription,
      required: payload.required,
    };
    return this.http.post(`${ApiUrl.v2BE}/custom-fields`, dto);
  }
}
