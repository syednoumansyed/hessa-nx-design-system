import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AnnouncementService } from '../../data-access/announcement.service';
import { PreviewPostCardComponent } from '../preview-post-card/preview-post-card.component';
import { IPostCardMeta } from '../preview-post-card/preview-post-card.interface';
import { CommonModule } from '@angular/common';
import { TuiLoaderModule } from '@taiga-ui/core';

@Component({
  selector: 'app-announcement-preview-modal',
  templateUrl: './announcement-preview-modal.component.html',
  standalone: true,
  imports: [CommonModule, PreviewPostCardComponent, TuiLoaderModule],
})
export class AnnouncementPreviewModalComponent implements OnInit {
  private readonly announcementService = inject(AnnouncementService);
  private readonly translocoService = inject(TranslocoService);

  @Input() announcementId!: number;
  @Input() announcementType!: string;

  readonly isLoading = signal(true);
  readonly postData = signal<IPostCardMeta | null>(null);

  ngOnInit() {
    this.loadAnnouncementData();
  }

  private loadAnnouncementData() {
    if (!this.announcementId) {
      this.isLoading.set(false);
      return;
    }

    this.announcementService
      .getPostById(this.announcementId, 'post')
      .subscribe({
        next: (response) => {
          const data = response.data;
          const displayName =
            this.translocoService.getActiveLang() === 'ar'
              ? data.createdBy.arFullName
              : data.createdBy.enFullName;

          const postMeta: IPostCardMeta = {
            id: data.id,
            title: data.title,
            content: data.content,
            attachments: (data.attachments ?? []).map((att) => ({
              key: att.key,
              url: att.url,
              extension: att.extension,
            })),
            createdBy: {
              id: data.createdBy.id,
              displayName: displayName,
            },
            createdAt: data.createdAt,
            viewed: true,
            reactions: (data as any).reactions ?? [],
          };

          this.postData.set(postMeta);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }
}
