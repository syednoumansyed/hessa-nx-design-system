import { Component, input } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-course-detail-skeleton',
  templateUrl: './course-detail-skeleton.component.html',
  imports: [IonSkeletonText],
  standalone: true,
})
export class CourseDetailSkeletonComponent {
  showIconOnly = input<boolean>(false);
}
