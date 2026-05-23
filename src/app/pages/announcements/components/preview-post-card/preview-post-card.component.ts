import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
  effect,
} from '@angular/core';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { AttachmentPreviewComponent } from '../../pages/post-form/attachment-preview/attachment-preview.component';
import { IPostCardMeta } from './preview-post-card.interface';
import { FilePreviewCardComponent } from '@ui-kit/file-preview-card/file-preview-card.component';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AnnouncementService } from '../../data-access/announcement.service';
import { VideoPreviewCardComponent } from '@ui-kit/video-preview-card/video-preview-card.component';
import { UnreadNotificationService } from '@shared/services/unread-notification.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxAirplaneOutline,
  saxExport3Outline,
  saxPlayOutline,
  saxStarOutline,
} from '@ng-icons/iconsax/outline';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ModalController } from '@ionic/angular/standalone';
import { ViewAuthorModalComponent } from '@pages/announcements/components/view-author-modal/view-author-modal.component';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { AnnouncementsService } from '@pages/announcements/announcements.service';
import { LinkifyPipe } from '@shared/pipes/linkify.pipe';
import {
  extractYouTubeUrls,
  getThumbnailURL,
  youtubeUrlToId,
} from '@pages/vcr/pages/utils';
import { isMobile } from '@utils/platform';
import { createYoutubePlayerDialog } from '@shared/components/youtube-player/youtube-player-dialog';
import { faSolidCirclePlay } from '@ng-icons/font-awesome/solid';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { hesIcon } from '@shared/types';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { ReactionType, TargetType } from '@ds/react/types/react.types';
import { ReactionService } from '@shared/services/react.service';
import { ReactionsComponent } from '@ds/react/react.component';
import { updateReactionLocally } from '@shared/utils/reaction.utils';
import { NewlinePipe } from '@pages/chat/pipe/new-line.pipe';

@Component({
  selector: 'app-preview-post-card',
  templateUrl: './preview-post-card.component.html',
  standalone: true,
  viewProviders: [
    provideIcons({
      saxExport3Outline,
      saxPlayOutline,
      saxStarOutline,
      saxAirplaneOutline,
      faSolidCirclePlay,
    }),
  ],
  imports: [
    CommonModule,
    AttachmentPreviewComponent,
    FilePreviewCardComponent,
    AvatarComponent,
    TranslocoDirective,
    VideoPreviewCardComponent,
    NgIcon,
    RbacDirective,
    LinkifyPipe,
    NewlinePipe,
    HesIconComponent,
    TimeAgoPipe,
    ReactionsComponent,
  ],
})
export class PreviewPostCardComponent implements OnInit, OnDestroy {
  readonly post = input.required<IPostCardMeta>();
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly imageSlider = inject(ImageSliderService);
  private readonly modalCtrl = inject(ModalController);
  private readonly announcementService = inject(AnnouncementService);
  private readonly announcementsService = inject(AnnouncementsService);
  private readonly youTubeDialog = createYoutubePlayerDialog();
  private readonly transloco = inject(TranslocoService);
  private readonly reactionService = inject(ReactionService);

  readonly selectedLanguage = computed(() => {
    return this.transloco.getActiveLang();
  });

  readonly planeIcon: hesIcon = {
    src: 'assets/icons/plane.svg',
    size: 'md',
    class: '',
  };

  viewPostAuthorPermission =
    RESOURCE_PERMISSION.announcement.viewPostOriginatorInfo;
  private readonly unreadNotificatoinService = inject(
    UnreadNotificationService,
  );

  /* 🔹 1.  PURE computed for the IDs  ------------------------------------ */
  readonly youtubeIds = computed(() => {
    const urls = extractYouTubeUrls(this.post().content) ?? [];
    return urls
      .map((url) => youtubeUrlToId(url))
      .filter((id): id is string => id !== null);
  });

  /* 🔹 2.  Side-effect that runs when IDs change  ------------------------ */
  private readonly _thumbEff = effect(
    () => {
      const ids = this.youtubeIds(); // Read signal
      if (ids.length) {
        this.fetchThumbnails(ids);
      } else {
        this.thumbnails.set([]);
      }
    },
    { allowSignalWrites: true },
  ); // Pass as an option here

  /* 🔹 3.  postPreview stays 100 % pure  --------------------------------- */
  readonly postPreview = computed(() => {
    const attachment = this.attachments();
    const post = this.post();
    const createdFor = post.createdFor
      ? this.getTranslatedCreatedFor(post.createdFor)
      : null;

    return {
      title: post.title,
      content: post.content,
      files: attachment.files,
      images: attachment.images,
      videos: attachment.video,
      createdBy: post.createdBy,
      createdAt: post.createdAt,
      createdFor: createdFor,
      viewed: post.viewed,
      youtubeIds: this.youtubeIds(),
      thumbnails: this.thumbnails(),
    };
  });

  readonly thumbnails = signal<string[]>([]);

  private async fetchThumbnails(ids: string[]) {
    const resolvedThumbnails = await Promise.all(
      ids.map((id) => getThumbnailURL(id)),
    );
    // Filter out null values
    const filteredThumbnails = resolvedThumbnails.filter(
      (thumbnail) => thumbnail !== null,
    ) as string[];
    this.thumbnails.set(filteredThumbnails);
  }

  readonly width = isMobile() ? window.innerWidth * 0.85 : '50%';

  private readonly attachments = computed(() => {
    return this.getImagesAndFile();
  });
  private readonly imagesUrl: string[] = [];
  private readonly elementRef = inject(ElementRef);

  private intersectionObserver: IntersectionObserver;
  ngOnInit(): void {
    if (!this.post().viewed) {
      this.setupIntersectionObserver();
    }

    const { images } = this.getImagesAndFile();
    images.forEach((image) => {
      if (image instanceof File) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            this.imagesUrl.push(result);
          }
        };
        reader.readAsDataURL(image);
      } else {
        this.imagesUrl.push(image.url);
      }
    });
  }

  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          this.onViewed();
          this.intersectionObserver.disconnect();
        }
      },
      {
        threshold: 0.8,
      },
    );
    this.intersectionObserver.observe(this.elementRef.nativeElement);
  }

  private getTranslatedCreatedFor(createdFor: string[]): string {
    if (!createdFor || createdFor.length === 0) {
      return '';
    }

    // Check if 'YOU' is in the array
    const hasYou = createdFor.includes('YOU');
    const otherUsers = createdFor.filter((user) => user !== 'YOU');

    if (hasYou && otherUsers.length === 0) {
      // Only 'YOU' in array: ['YOU'] -> 'global.for_you'
      return this.transloco.translate('global.for_you');
    } else if (hasYou && otherUsers.length > 0) {
      // 'YOU' + other users: ['YOU', 'Sid', 'Mike'] -> 'global.for_you, Sid, Mike'
      const forYouText = this.transloco.translate('global.for_you');
      return `${forYouText}, ${otherUsers.join(', ')}`;
    } else {
      // Only other users: ['Sid', 'Mike'] -> 'global.for Sid, Mike'
      const forText = this.transloco.translate('global.for');
      return `${forText} ${otherUsers.join(', ')}`;
    }
  }

  onViewed() {
    const postId = this.post().id;
    if (postId) {
      this.announcementService.viewPost(postId).subscribe(() => {
        this.unreadNotificatoinService.loadUnreadForSelectedAcademicYear();
      });
    }
  }

  getFileName(attachment: IAttachmentControlValue) {
    if (attachment instanceof File) {
      return attachment.name;
    } else {
      return attachment.key;
    }
  }

  onOpenSlider(idx: number) {
    this.imageSlider.show(this.imagesUrl, idx);
  }

  private getImagesAndFile() {
    const attachments = this.post().attachments;
    const images: IAttachmentControlValue[] = [];
    const files: IAttachmentControlValue[] = [];
    const video: IAttachmentControlValue[] = [];

    attachments?.forEach((attachment) => {
      let type = null;
      if (attachment instanceof File) {
        type = attachment.type;
      } else {
        type = attachment.key;
      }
      if (
        type.includes('pdf') ||
        type.includes('csv') ||
        type.includes('ppt') ||
        type.includes('vnd.ms-powerpoint') ||
        type.includes(
          'vnd.openxmlformats-officedocument.presentationml.presentation',
        )
      ) {
        files.push(attachment);
      } else if (type.includes('video')) {
        video.push(attachment);
      } else {
        images.push(attachment);
      }
    });
    return { images, files, video };
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  async openAuthorPopup() {
    if (
      !this.rbacService.hasPermission(
        RESOURCE_PERMISSION.announcement.viewPostOriginatorInfo,
      )
    )
      return;
    // open author popup
    const modal = await this.modalCtrl?.create({
      component: ViewAuthorModalComponent,
      cssClass: 'xl-modal overflow-y-auto',
      componentProps: {
        postId: this.post().id,
      },
    });
    modal.onDidDismiss().then(() => {
      this.announcementsService.resetAuthorInfo();
    });
    modal.present();
  }

  openYoutubePlayer(id: string) {
    this.youTubeDialog(this.postPreview().title, id);
  }

  getReactionHandler() {
    return (event: { type: ReactionType; isAdding: boolean }) => {
      this.post().reactions = updateReactionLocally(
        this.post().reactions || [],
        event.type,
        event.isAdding,
      );

      this.reactionService
        .toggleReaction(
          this.post().id?.toString() || '',
          TargetType.ANNOUNCEMENT,
          event.type,
          event.isAdding,
        )
        .subscribe({
          error: () => {
            this.post().reactions = updateReactionLocally(
              this.post().reactions || [],
              event.type,
              !event.isAdding,
            );
          },
        });
    };
  }
}
