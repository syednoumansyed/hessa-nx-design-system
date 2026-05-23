import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { DsTabsComponent, DsTabsWithSwipeComponent, Tab } from '@ds/tabs';
import { TabsContentSkeletonComponent } from '../../components/tabs-content-skeleton/tabs-content-skeleton.component';
import {
  CarousalComponent,
  DsCarouselSlide,
} from 'src/app/design-system/carousal/carousal.component';
import { DsProgressBarComponent } from '@ds/progress-bar/progress-bar.component';
import { StudentsService } from 'src/app/pages/user-management/students/students.service';
import { Student } from '@shared/dto-transformation';
import { DsObjId } from '@ds/common.types';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-navigation-demo',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    DsTabsComponent,
    DsTabsWithSwipeComponent,
    TabsContentSkeletonComponent,
    CarousalComponent,
    DsProgressBarComponent,
    DemoPageWrapperComponent,
  ],
  templateUrl: './navigation-demo.page.html',
})
export class NavigationDemoPage implements OnInit {
  private studentsService = inject(StudentsService);

  // Tabs
  tabsData = [
    { id: 'messages', label: 'Messages', badge: 8 },
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
  ];
  activeTab = signal<any>({ id: 'messages', label: 'Messages', badge: 8 });

  // Tabs with API
  studentsTabs: Tab<number>[] = [
    { id: 1, label: 'Active' },
    { id: 2, label: 'Recently Enrolled' },
    { id: 3, label: 'Pending' },
    { id: 4, label: 'On Leave' },
    { id: 5, label: 'Graduated Students List' },
    { id: 6, label: 'Inactive' },
    { id: 7, label: 'Transfer Requests' },
    { id: 8, label: 'Alumni' },
  ];
  activeStudentsPage = signal<number>(1);
  studentsData = signal<Student[]>([]);
  isLoadingStudents = signal<boolean>(false);
  TabsSkeletonComponent = TabsContentSkeletonComponent;

  // Carousel
  carouselSlides: DsCarouselSlide[] = [
    {
      id: '1',
      boldTitle: 'Week 1',
      regularTitle: '(25/03/2025 - 31/03/2025)',
      isHighlighted: false,
    },
    {
      id: '2',
      boldTitle: 'Week 2',
      regularTitle: '(01/04/2025 - 07/04/2025)',
      isHighlighted: true,
    },
    {
      id: '3',
      boldTitle: 'Week 3',
      regularTitle: '(08/04/2025 - 14/04/2025)',
      isHighlighted: false,
    },
    {
      id: '4',
      boldTitle: 'Week 4',
      regularTitle: '(15/04/2025 - 21/04/2025)',
      isHighlighted: false,
    },
    {
      id: '5',
      boldTitle: 'Week 5',
      regularTitle: '(22/04/2025 - 28/04/2025)',
      isHighlighted: false,
    },
  ];
  currentSlideId: DsObjId = '';
  isContentLoading: boolean = false;

  // Progress Bar
  progressBarValue = signal(0);

  ngOnInit() {
    this.fetchStudentsForPage(1);
    this.retriggerAnimation();
  }

  onTabChanged(tabId: string) {
    this.activeTab.set(this.tabsData.find((tab) => tab.id === tabId));
  }

  onStudentsTabChanged(pageNumber: number) {
    this.activeStudentsPage.set(pageNumber);
    this.fetchStudentsForPage(pageNumber);
  }

  private fetchStudentsForPage(pageNumber: number) {
    this.isLoadingStudents.set(true);
    this.studentsService
      .fetchStudents({
        pageNumber: pageNumber,
        itemsPerPage: 5,
      })
      .subscribe({
        next: (response) => {
          this.studentsData.set(response.data);
          this.isLoadingStudents.set(false);
        },
        error: () => {
          this.studentsData.set([]);
          this.isLoadingStudents.set(false);
        },
      });
  }

  onSlideChange(slideId: DsObjId): void {
    this.currentSlideId = slideId;
    this.isContentLoading = true;
    setTimeout(() => {
      this.isContentLoading = false;
    }, 1500);
  }

  retriggerAnimation() {
    this.progressBarValue.set(0);
    setTimeout(() => {
      const interval = setInterval(() => {
        const currentValue = this.progressBarValue();
        if (currentValue < 100) {
          this.progressBarValue.set(currentValue + 10);
        } else {
          clearInterval(interval);
        }
      }, 500);
    }, 100);
  }
}
