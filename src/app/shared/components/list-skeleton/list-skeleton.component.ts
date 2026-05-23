import { Component, Input, OnInit, signal } from '@angular/core';
import {
  IonSkeletonText,
  IonItem,
  IonThumbnail,
  IonLabel,
} from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-list-skeleton',
  templateUrl: './list-skeleton.component.html',
  imports: [IonSkeletonText, IonItem, IonThumbnail, IonLabel],
})
export class ListSkeletonComponent implements OnInit {
  @Input() itemsCount: number = 3;
  // items: any[] = new Array(this.itemsCount);
  items: any = signal([]);

  ngOnInit() {
    this.items.set(new Array(this.itemsCount));
  }
}
