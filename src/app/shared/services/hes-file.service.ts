import { inject, Injectable } from '@angular/core';
import { HesToasterService } from './hes-toaster.service';
import { Capacitor } from '@capacitor/core';
import {
  Filesystem,
  Directory,
  DownloadFileResult,
} from '@capacitor/filesystem';
import { Platform } from '@ionic/angular';
import { randomId } from '@shared/utils/randomId';
import { FileOpener } from '@capacitor-community/file-opener';
import { LayoutService } from '@layout/layout.service';
import { Share } from '@capacitor/share';

@Injectable({
  providedIn: 'root',
})
export class HesFileService {
  private readonly platform = inject(Platform);
  private readonly toastr = inject(HesToasterService);
  private readonly layout = inject(LayoutService);

  async downloadFile({
    url,
    fileName,
    extension,
  }: {
    url: string;
    fileName?: string;
    extension?: string;
  }) {
    let filename: string =
      fileName ?? this.getFilenameFromUrl(url) ?? `nx-file-${randomId()}`;
    if (extension && !filename.endsWith(`.${extension}`)) {
      filename += `.${extension}`;
    }
    if (Capacitor.isNativePlatform()) {
      this.checkFileSystemPermission(async () => {
        const fileResult = await this.downloadFileToMobile(url, filename);
        if (fileResult) await this.openDownloadedFileMobile(fileResult);
      });
    } else {
      await this.downloadFileToWeb(url, filename);
    }
  }

  private getFilenameFromUrl(url: string): string | undefined {
    try {
      // Get the part after the last '/'
      const urlParts = url.split('/');
      const encodedFilename = urlParts[urlParts.length - 1]
        ?.split('#')[0]
        ?.split('?')[0];

      // Decode the URL-encoded string
      const decodedFilename = decodeURIComponent(encodedFilename);
      return decodedFilename;
    } catch (error) {
      console.error('Error decoding filename:', error);
      return undefined;
    }
  }

  private async downloadFileToWeb(url: string, filename: string) {
    try {
      this.layout.showProgressBar();
      const response = await fetch(url);
      if (!response.ok) {
        this.layout.hideProgressBar();
        this.toastr.error('Unable to download the File');
      } else {
        const blob = await response.blob();
        const urlObject = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlObject;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        this.layout.hideProgressBar();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(urlObject);
      }
    } catch (error: any) {
      this.layout.hideProgressBar();
      if (error.message) this.toastr.error(error.message);
      else this.toastr.showGlobalWrongMessage();
    }
  }

  private checkFileSystemPermission(callback: () => void) {
    Filesystem.checkPermissions().then(async (permissionResult) => {
      if (permissionResult.publicStorage === 'prompt') {
        Filesystem.requestPermissions().then(
          async (requestPermissionResult) => {
            if (requestPermissionResult.publicStorage === 'granted') {
              callback();
            }
          },
        );
      } else if (permissionResult.publicStorage === 'granted') {
        callback();
      }
    });
  }

  private async openDownloadedFileMobile(fileResult: DownloadFileResult) {
    this.shareImage(fileResult.path!);
  }

  async shareImage(rawPath: string): Promise<void> {
    const platform = Capacitor.getPlatform();

    let localPath = rawPath; // may be remote URL or already-local path

    /* ------------------------------------------------------------ */
    /* 1. DOWNLOAD if it's a remote URL                             */
    /* ------------------------------------------------------------ */
    if (/^https?:\/\//i.test(rawPath)) {
      const fileName = decodeURIComponent(rawPath.split('/').pop()!); // keep original name

      const { path } = await Filesystem.downloadFile({
        url: rawPath,
        directory: Directory.Documents,
        path: fileName,
        recursive: true,
      });

      localPath = path!; // absolute /storage/… path (Android) or /var/mobile/… (iOS)
    }

    /* ------------------------------------------------------------ */
    /* 2. BUILD a share-safe URI                                    */
    /* ------------------------------------------------------------ */
    let shareUrl = localPath; // iOS is happy with this absolute path

    if (platform === 'android') {
      // Android 10+ prefers a content:// URI from FileProvider
      const fileName = localPath.split('/').pop()!;

      const { uri } = await Filesystem.getUri({
        directory: Directory.Documents,
        path: fileName, // relative, NOT absolute!
      });

      shareUrl = uri; // e.g. content://com.your.app.fileprovider/my_images/Documents/filename.jpg
    }

    /* ------------------------------------------------------------ */
    /* 3. SHOW the share sheet                                      */
    /* ------------------------------------------------------------ */
    await Share.share({
      url: shareUrl,
      dialogTitle: 'Share file',
    });
  }

  private async downloadFileToMobile(url: string, filename: string) {
    try {
      this.layout.showProgressBar();
      const fileResult = await Filesystem.downloadFile({
        url,
        path: filename,
        directory: Directory.Documents,
        recursive: true,
      });
      this.layout.hideProgressBar();
      return fileResult;
    } catch (_err) {
      this.layout.hideProgressBar();
      this.toastr.showGlobalWrongMessage();
      return null;
    }
  }
}
