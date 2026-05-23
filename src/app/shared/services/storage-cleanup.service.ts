import { Injectable } from '@angular/core';

const STORAGE_KEYS = {
  CLEAN_STORAGE: 'cleanStorageV1', // Change version when you need cleanup
} as const;

@Injectable({
  providedIn: 'root',
})
export class StorageCleanupService {
  /**
   * Checks if storage should be cleaned and performs cleanup if needed
   * Returns true if cleanup was performed, false otherwise
   */
  checkAndCleanStorage(): boolean {
    const cleanStorageFlag = localStorage.getItem(STORAGE_KEYS.CLEAN_STORAGE);

    // If not found, this is the first time - clean and set the flag
    if (cleanStorageFlag === null) {
      this.clearAllStorage();
      return true;
    }

    // If 'done' found, do normal flow
    return false;
  } /**
   * Clears all localStorage except the cleanup flag
   */
  private clearAllStorage(): void {
    // Clear all localStorage
    localStorage.clear();

    // Set the flag to indicate cleanup was done for this version
    localStorage.setItem(STORAGE_KEYS.CLEAN_STORAGE, 'done');
  }
}
