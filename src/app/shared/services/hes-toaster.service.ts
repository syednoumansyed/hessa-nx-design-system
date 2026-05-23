import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';

export interface ShowBackendErrorOptions {
  ignoreErrorCodes?: number[];
}

@Injectable({
  providedIn: 'root',
})
export class HesToasterService {
  private readonly toaster = inject(ToastrService);
  private readonly translocoService = inject(TranslocoService);

  private cls(type: string) {
    return `ngx-toastr toast-base toast-${type}`;
  }

  showBackendError(
    errorResponse: HttpErrorResponse,
    options: ShowBackendErrorOptions = {},
  ) {
    // Check if this error code should be ignored
    if (options.ignoreErrorCodes?.includes(errorResponse.status)) {
      return;
    }

    if (errorResponse.status === 500) {
      this.showGlobalWrongMessage();
      return;
    }
    const error = errorResponse.error;

    const message =
      error?.messageRef ??
      error?.message ??
      error?.error?.details?.[0]?.message;

    if (message) {
      const translation = this.translocoService.translate(message);
      this.toaster.error('', translation.length > 0 ? translation : message, {
        toastClass: this.cls('error'),
        closeButton: false,
      });
    } else {
      this.showGlobalWrongMessage();
    }
  }

  success(message: string, title = '') {
    this.toaster.success(message, title, {
      toastClass: this.cls('success'),
      closeButton: true,
      payload: { showIcon: false },
    });
  }

  error(message: string, title = '') {
    this.toaster.error(message, title, {
      toastClass: this.cls('error'),
      closeButton: true,
      payload: { showIcon: false },
    });
  }

  info(message: string, title = '') {
    this.toaster.info(message, title, {
      toastClass: this.cls('info'),
      closeButton: true,
      payload: { showIcon: false },
    });
  }

  warning(message: string, title = '') {
    this.toaster.warning(message, title, {
      toastClass: this.cls('warning'),
      closeButton: true,
      payload: { showIcon: false },
    });
  }

  showGlobalWrongMessage(message = '') {
    this.toaster.error(
      message,
      this.translocoService.translate('global.wrong_msg.title'),
      {
        toastClass: this.cls('error'),
        closeButton: true,
        payload: { showIcon: false },
      },
    );
  }
}
