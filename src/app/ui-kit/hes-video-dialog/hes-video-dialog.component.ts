import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import videojs from 'video.js';
import { HesIconComponent } from '../../shared/components/hes-icon/hes-icon.component';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponentsProps } from '@shared/types';
import { ModalController } from '@ionic/angular/standalone';
import { DisableRightClickDirective } from './disable-right-click.directive';

@Component({
  selector: 'app-hes-video-dialog',
  templateUrl: './hes-video-dialog.component.html',
  styleUrls: ['./hes-video-dialog.component.scss'],
  standalone: true,
  imports: [HesIconComponent, DisableRightClickDirective],
})
export class HesVideoDialogComponent implements OnInit, AfterViewInit {
  private modalCtrl = inject(ModalController);

  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'lg',
  };

  @ViewChild('target', { static: true }) target: ElementRef;

  player: any;

  @Input() title: string;
  @Input() src: string | File;
  @Input() onPlay: () => void;
  constructor(private elementRef: ElementRef) {}

  // Instantiate a Video.js player OnInit
  ngOnInit() {}

  ngAfterViewInit(): void {
    let videoSrc: string;
    let videoType: string;
    if (this.src instanceof File) {
      videoSrc = URL.createObjectURL(this.src);
      videoType = this.src.type;
    } else {
      videoSrc = this.src;
      videoType = 'video/mp4';
    }
    this.player = videojs('target', {
      enableDocumentPictureInPicture: false,
      disablePictureInPicture: true,
      enableSmoothSeeking: true,
      controlBar: {
        skipButtons: {
          backward: 10,
          forward: 10,
        },
      },
      sources: [
        {
          src: videoSrc,
          type: videoType,
        },
      ],
    });

    this.player.on('play', this.handlePlay);
  }

  handlePlay = () => {
    this.onPlay();
  };

  // Dispose the player OnDestroy
  ngOnDestroy() {
    if (this.player) {
      this.player.off('play', this.handlePlay);
      this.player.dispose();
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
