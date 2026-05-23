import { Injectable, inject } from '@angular/core';
import { CanActivate } from '@angular/router';
import { StorageCleanupService } from '@shared/services/storage-cleanup.service';

@Injectable({
  providedIn: 'root',
})
export class StorageCleanupGuard implements CanActivate {
  private storageCleanupService = inject(StorageCleanupService);

  canActivate(): boolean {
    // Check and perform cleanup if needed
    const shouldReload = this.storageCleanupService.checkAndCleanStorage();

    if (shouldReload) {
      // Cleanup was performed, reload the page to start fresh
      setTimeout(() => {
        window.location.reload();
      }, 100); // Small delay to ensure cleanup is complete

      return false; // Prevent route activation until reload
    }

    // No cleanup needed, continue with normal flow
    return true;
  }
}
