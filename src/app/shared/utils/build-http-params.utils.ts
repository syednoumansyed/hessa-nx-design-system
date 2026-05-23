import { HttpParams } from '@angular/common/http';

export function buildHttpParams(params: { [key: string]: any }): HttpParams {
  let httpParams = new HttpParams();

  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (Array.isArray(value)) {
      // Append each element with the bracket notation for arrays.
      value.forEach((item) => {
        httpParams = httpParams.append(`${key}[]`, item);
      });
    } else if (value !== undefined && value !== null) {
      // Set non-array values.
      httpParams = httpParams.set(key, value);
    }
  });

  return httpParams;
}
