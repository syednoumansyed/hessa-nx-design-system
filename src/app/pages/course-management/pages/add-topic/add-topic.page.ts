import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { TopicFormComponent } from '../../components/topic-form/topic-form.component';
import { PageTitleService } from '@layout/page-title.service';
import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';

@Component({
  selector: 'app-add-topic',
  templateUrl: './add-topic.page.html',
  styleUrls: ['./add-topic.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, TopicFormComponent],
})
export class AddTopicPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  subjectTitle = inject(CourseListService)
    .mappedCoursesList()
    .find((c) => c.courseId === +this.route.snapshot.params['courseId'])?.title;
  pageTitleService = inject(PageTitleService);
  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit() {
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
  }
  ionViewWillEnter() {
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
  }
}
