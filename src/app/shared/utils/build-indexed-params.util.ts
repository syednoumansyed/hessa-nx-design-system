import { HttpParams } from '@angular/common/http';

export function buildIndexedParams(params: Record<string, any>): HttpParams {
  let httpParams = new HttpParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        httpParams = httpParams.append(`${key}[${idx}]`, item);
      });
    } else if (value !== undefined && value !== null) {
      httpParams = httpParams.set(key, value);
    }
  });
  return httpParams;
}
