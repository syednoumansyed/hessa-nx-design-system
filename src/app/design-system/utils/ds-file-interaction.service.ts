import { inject, Injectable } from '@angular/core';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { dsGetAttachmentCategory } from '@ds/attachment/ds-get-attachment-type.util';
import { HesFileService } from '@shared/services/hes-file.service';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { createVideoDialog } from '@ui-kit/hes-video-dialog/hes-video-dialog';
import { createYoutubePlayerDialog } from '@shared/components/youtube-player/youtube-player-dialog';
import { isYoutubeUrl } from '@pages/vcr/pages/utils';

/**
 * Design System File Interaction Service
 * Provides intelligent file handling based on file type:
 * - Downloads documents (PDF, Word, Excel, PowerPoint)
 * - Opens image preview for images
 * - Opens video player for videos
 */
@Injectable({
  providedIn: 'root',
})
export class DsFileInteractionService {
  private readonly fileService = inject(HesFileService);
  private readonly imageSliderService = inject(ImageSliderService);
  private readonly youTubeDialog = createYoutubePlayerDialog();
  private readonly videoModal = createVideoDialog();

  /**
   * Unified method for handling file interactions
   * Takes a configuration object with priority: attachment > explicit type > auto-detection from extension
   */
  async handleFile(config: {
    attachment?: DsAttachmentControlValue;
    type?: 'video' | 'image' | 'document';
    url?: string;
    title?: string;
    extension?: string; // Explicit extension with higher priority
    onPlay?: () => void;
    downloadFileName?: string;
  }): Promise<void> {
    try {
      // Priority 1: Use attachment if provided
      if (config.attachment) {
        await this.handleFileFromAttachment(
          config.attachment,
          {
            videoTitle: config.title,
            imageTitle: config.title,
            downloadFileName: config.downloadFileName,
          },
          config.onPlay,
        );
        return;
      }

      // Priority 2: Use explicit type with url (if both provided)
      if (config.type && config.url) {
        await this.handleFileFromExplicitParams(
          config.type,
          config.url,
          config.title || 'File',
          config.onPlay,
          config.downloadFileName,
          config.extension,
        );
        return;
      }

      // Priority 3: Auto-detect type from extension (explicit or URL) and handle accordingly
      if (config.url) {
        const detectedType = this.detectTypeFromExtension(
          config.extension,
          config.url,
        );
        if (detectedType) {
          await this.handleFileFromExplicitParams(
            detectedType,
            config.url,
            config.title || 'File',
            config.onPlay,
            config.downloadFileName,
            config.extension,
          );
          return;
        }
      }

      console.error(
        'Invalid configuration: Must provide either attachment, url with recognizable extension, or type+url',
      );
    } catch (error) {
      console.error('Error handling file:', error);
    }
  }

  /**
   * Checks if a file type supports interaction
   */
  isInteractable(attachment: DsAttachmentControlValue): boolean {
    if (!attachment) return false;
    const fileType = dsGetAttachmentCategory(attachment);
    return fileType !== null;
  }

  /**
   * Gets the interaction type for a file
   */
  getInteractionType(
    attachment: DsAttachmentControlValue,
  ): 'download' | 'preview' | 'play' | 'view' | null {
    if (!attachment) return null;

    const fileType = dsGetAttachmentCategory(attachment);

    switch (fileType) {
      case 'image':
        return 'preview';
      case 'video':
        return 'play';
      case 'pdf':
      case 'word':
      case 'excel':
      case 'ppt':
        return 'download';
      default:
        return 'download';
    }
  }

  // Private implementation methods

  /**
   * Detects file type from explicit extension (priority) or URL extension (fallback)
   */
  private detectTypeFromExtension(
    explicitExtension?: string,
    url?: string,
  ): 'video' | 'image' | 'document' | null {
    // Priority 1: Use explicit extension if provided
    let extension = explicitExtension?.toLowerCase();

    // Priority 2: Extract from URL if no explicit extension
    if (!extension && url) {
      const extractedExtension = this.extractExtensionFromUrl(url);
      extension = extractedExtension || undefined;
    }

    if (!extension) return null;

    // Video extensions
    if (
      ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'mkv'].includes(
        extension,
      )
    ) {
      return 'video';
    }

    // Image extensions
    if (
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(
        extension,
      )
    ) {
      return 'image';
    }

    // PDF extension - treat as document for download
    if (extension === 'pdf') {
      return 'document';
    }

    // Document extensions
    if (
      [
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'txt',
        'rtf',
        'csv',
      ].includes(extension)
    ) {
      return 'document';
    }

    return null;
  }

  /**
   * Extracts file extension from URL, handling query parameters and complex URLs
   */
  private extractExtensionFromUrl(url: string): string | null {
    try {
      // Remove query parameters and fragments
      const urlWithoutQuery = url.split('?')[0].split('#')[0];

      // Extract filename from path
      const pathParts = urlWithoutQuery.split('/');
      const filename = pathParts[pathParts.length - 1];

      // Extract extension from filename
      const extensionMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
      return extensionMatch ? extensionMatch[1].toLowerCase() : null;
    } catch (error) {
      console.warn('Error extracting extension from URL:', error);
      return null;
    }
  }

  private async handleFileFromAttachment(
    attachment: DsAttachmentControlValue,
    options?: {
      imageTitle?: string;
      videoTitle?: string;
      downloadFileName?: string;
    },
    onPlay?: () => void,
  ): Promise<void> {
    const fileType = dsGetAttachmentCategory(attachment);

    switch (fileType) {
      case 'image':
        const imageUrl = this.getFileUrl(attachment);
        if (imageUrl) {
          this.imageSliderService.show([imageUrl]);
        }
        break;
      case 'video':
        await this.handleVideoFromAttachment(
          attachment,
          options?.videoTitle,
          onPlay,
        );
        break;
      case 'pdf':
      case 'word':
      case 'excel':
      case 'ppt':
      default:
        await this.handleDocumentFromAttachment(
          attachment,
          options?.downloadFileName,
        );
        break;
    }
  }

  private async handleFileFromExplicitParams(
    type: 'video' | 'image' | 'document',
    url: string,
    title: string,
    onPlay?: () => void,
    downloadFileName?: string,
    explicitExtension?: string,
  ): Promise<void> {
    switch (type) {
      case 'video':
        await this.handleExplicitVideo(url, title, onPlay);
        break;
      case 'image':
        this.imageSliderService.show([url]);
        break;
      case 'document':
        const extension =
          explicitExtension || this.extractExtensionFromUrl(url) || undefined;
        await this.fileService.downloadFile({
          url,
          fileName: downloadFileName || title,
          extension,
        });
        break;
    }
  }

  private async handleVideoFromAttachment(
    attachment: DsAttachmentControlValue,
    title?: string,
    onPlay?: () => void,
  ): Promise<void> {
    if ('isLink' in attachment && attachment.isLink) {
      const isYoutubeLink = isYoutubeUrl(attachment.url);
      if (isYoutubeLink) {
        this.youTubeDialog(
          title || attachment.name || 'Video',
          attachment.url,
          onPlay,
        );
      } else {
        window.open(attachment.url, '_blank');
      }
    } else {
      const videoSource =
        attachment instanceof File ? attachment : this.getFileUrl(attachment);
      if (videoSource) {
        await this.videoModal({
          src: videoSource,
          title: title || this.getFileName(attachment) || 'Video',
          onPlay,
        });
      }
    }
  }

  private async handleExplicitVideo(
    url: string,
    title: string,
    onPlay?: () => void,
  ): Promise<void> {
    const isYoutubeLink = isYoutubeUrl(url);
    if (isYoutubeLink) {
      this.youTubeDialog(title, url, onPlay);
    } else {
      await this.videoModal({
        src: url,
        title,
        onPlay,
      });
    }
  }

  private async handleDocumentFromAttachment(
    attachment: DsAttachmentControlValue,
    customFileName?: string,
  ): Promise<void> {
    const fileName = customFileName || this.getFileName(attachment);
    const extension = this.getFileExtension(attachment);
    const url = this.getFileUrl(attachment);

    if (url) {
      await this.fileService.downloadFile({
        url,
        fileName,
        extension,
      });
    }
  }

  private getFileUrl(attachment: DsAttachmentControlValue): string | null {
    if (attachment instanceof File) {
      return URL.createObjectURL(attachment);
    }
    return attachment.url || null;
  }

  private getFileName(attachment: DsAttachmentControlValue): string {
    if (attachment instanceof File) {
      return attachment.name;
    }
    return attachment.title || attachment.name || 'download';
  }

  private getFileExtension(
    attachment: DsAttachmentControlValue,
  ): string | undefined {
    if (attachment instanceof File) {
      return attachment.name.split('.').pop();
    }
    return attachment.extension;
  }
}

/**
 * Functional interface for dependency injection
 */
export function createDsFileInteractionService() {
  return inject(DsFileInteractionService);
}
