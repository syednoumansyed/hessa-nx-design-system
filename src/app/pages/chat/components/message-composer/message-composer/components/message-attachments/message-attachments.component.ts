import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  faCamera,
  faFileDoc,
  faPhotoFilm,
} from '@fortawesome/pro-light-svg-icons';
import { IonList, IonItem } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';

@Component({
  selector: 'app-message-attachments',
  templateUrl: './message-attachments.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    HesIconComponent,
    TranslocoDirective,
  ],
})
export class MessageAttachmentsComponent implements OnInit {
  @Input() camera: () => void = () => {};
  @Input() pickMedia: () => void = () => {};
  @Input() pickDoc: () => void = () => {};
  readonly camraIcon: FaIconComponentsProps = {
    icon: faCamera,
    size: 'lg',
  };
  readonly mediaIcon: FaIconComponentsProps = {
    icon: faPhotoFilm,
    size: 'lg',
  };
  readonly fileDoc: FaIconComponentsProps = {
    icon: faFileDoc,
    size: 'lg',
  };
  acceptFileTypes: 'image/png, image/jpeg, application/pdf';

  constructor() {}

  ngOnInit() {}
  openCamera() {
    this.camera();
  }

  onPickMedia() {
    this.pickMedia();
  }

  onPickDoc() {
    this.pickDoc();
  }
}
