import { Injectable } from '@angular/core';
import { isDevEnvironment } from '@shared/utils/env.util';

@Injectable({
  providedIn: 'root',
})
export class HesLogService {
  /**
   * Logs error messages - always logs in all environments
   */
  error(message: any, ...optionalParams: any[]): void {
    if (isDevEnvironment()) {
      console.error('[ERROR]', message, ...optionalParams);
    }
  }
}
