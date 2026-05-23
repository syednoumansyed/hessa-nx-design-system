import { Component, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { provideIcons } from '@ng-icons/core';
import {
  saxHome2Outline,
  saxBuildings2Outline,
  saxEdit2Outline,
  saxMessage2Outline,
} from '@ng-icons/iconsax/outline';
import { faHome, faUser, faGear } from '@fortawesome/pro-regular-svg-icons';
import { faCheck } from '@fortawesome/pro-light-svg-icons';
import {
  faCircleExclamation,
  faMicrophone,
} from '@fortawesome/pro-solid-svg-icons';
import { isMobile } from '@shared/utils/platform';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { AvatarComponent } from 'src/app/design-system/avatar/avatar.component';
import { DsStudentSelectorComponent } from 'src/app/design-system/student-selector/student-selector.component';
import { DsIconContainerComponent } from '@ds/icon-container/icon-container.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ActionListService } from '@shared/services/action-list.service';
import { DsActionListItemConfig } from '@ds/action-list';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-data-display-demo',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    DsButtonComponent,
    DsIconComponent,
    AvatarComponent,
    DsStudentSelectorComponent,
    DsIconContainerComponent,
    DemoPageWrapperComponent,
    NgClass,
  ],
  viewProviders: [
    provideIcons({
      saxHome2Outline,
      saxBuildings2Outline,
      saxEdit2Outline,
      saxMessage2Outline,
    }),
  ],
  templateUrl: './data-display-demo.page.html',
})
export class DataDisplayDemoPage {
  private toast = inject(HesToasterService);
  private actionListService = inject(ActionListService);
  isMobile = isMobile();

  homeIcon = faHome;

  imageUrl =
    'https://images.pexels.com/photos/1288182/pexels-photo-1288182.jpeg?cs=srgb&dl=pexels-juanlaurio-1288182.jpg&fm=jpg';
  avatarUrl = 'assets/icons/inter-male.png';

  studentSelectorList = [
    {
      id: '1',
      fullName:
        'Abdul Rehman bin auf bin maalik Abdul Rehman bin auf bin maalik Abdul Rehman bin auf bin maalik',
      class: '3',
      level: 'first level',
      imageUrl: 'assets/icons/inter-male.png',
    },
    {
      id: '2',
      fullName: 'Abdulaziz bin Abdullah',
      class: '3',
      level: 'second level',
      imageUrl: 'assets/icons/inter-male.png',
    },
    {
      id: '3',
      fullName: 'Muhammad bin Abdullah',
      class: '1',
      level: 'third level',
      imageUrl: 'assets/icons/inter-male.png',
    },
  ];

  iconContainerMenuItems: PopupItem[] = [
    {
      id: 'profile',
      title: 'global.profile.title',
      icon: faUser,
      state: 'default',
      action: () => this.toast.success('Selected: Profile', 'Responsive Menu'),
    },
    {
      id: 'settings',
      title: 'global.settings.title',
      icon: faGear,
      state: 'default',
      action: () => this.toast.success('Selected: Settings', 'Responsive Menu'),
    },
  ];

  onStudentSelected(student: any) {
    this.toast.success(`Selected: ${student.fullName}`, 'Student Selected');
  }

  async showUserSelectionDemo() {
    const userItems: DsActionListItemConfig[] = [
      {
        id: 'user-1',
        title: 'John Smith',
        upperSupportingText: 'Administrator',
        avatar: {
          fullName: 'John Smith',
          imageUrl: 'assets/icons/inter-male.png',
        },
        supportingText: [{ text: 'Active', variant: 'success' }],
      },
      {
        id: 'user-1',
        title: 'John Smith',
        upperSupportingText: 'Administrator',
        avatar: {
          fullName: 'John Smith',
          imageUrl: 'assets/icons/inter-male.png',
        },
        supportingText: [
          { text: 'Submit', variant: 'success', count: 2 },
          { text: 'Missed', variant: 'danger', count: 1 },
        ],
      },
      {
        id: 'user-2',
        title: 'Sarah Johnson',
        upperSupportingText: 'Teacher',
        avatar: { fullName: 'Sarah Johnson' },
        supportingText: [
          {
            text: 'Online',
            variant: 'success',
            icon: faMicrophone,
            count: 5,
          },
          {
            text: 'Offline',
            variant: 'danger',
            icon: faMicrophone,
            count: 3,
          },
        ],
        endIconConfig: {
          showArrow: true,
        },
      },
      {
        id: 'user-3',
        title: 'Mike Davis',
        upperSupportingText: 'Student',
        avatar: { fullName: 'Mike Davis' },
        supportingText: { text: 'Offline', variant: 'default' },
        endIconConfig: {
          showArrow: false,
        },
      },
      {
        id: 'user-4',
        title: 'Emma Wilson',
        avatar: { fullName: 'Emma Wilson' },
        supportingText: {
          text: 'Away',
          variant: 'danger',
          icon: faCircleExclamation,
          count: 9,
        },
        endIconConfig: {
          icon: faCircleExclamation,
        },
      },
      {
        id: 'user-5',
        title: 'Alex Rodriguez',
        upperSupportingText: 'Principal',
        avatar: { fullName: 'Alex Rodriguez' },
        endIconConfig: {
          icon: faCheck,
          cssClass: 'text-primary',
        },
      },
      {
        id: 'user-6',
        title: 'Lisa Chen',
        avatar: { fullName: 'Lisa Chen' },
      },
      {
        id: 'user-7',
        title: 'David Wilson',
        upperSupportingText: 'Librarian',
        supportingText: { text: 'Busy', variant: 'default' },
      },
      {
        id: 'user-8',
        title: 'Maria Garcia',
        supportingText: { text: 'Available', variant: 'success' },
      },
      {
        id: 'user-9',
        title: 'Robert Brown',
        upperSupportingText: 'Counselor',
      },
      {
        id: 'user-10',
        title: 'Jennifer Lee',
      },
      {
        id: 'user-11',
        title: 'Thomas Anderson',
        upperSupportingText: 'IT Support',
        avatar: { fullName: 'Thomas Anderson' },
        supportingText: { text: 'On Call', variant: 'default' },
      },
      {
        id: 'user-12',
        title: 'Jessica Parker',
        upperSupportingText: 'Nurse',
        supportingText: { text: 'Available', variant: 'success' },
      },
      {
        id: 'user-13',
        title: 'Dr. Abdullah bin Mohammed Al-Rashid Al-Maktoum',
        upperSupportingText: 'Head of Mathematics Department',
        avatar: { fullName: 'Dr. Abdullah bin Mohammed Al-Rashid Al-Maktoum' },
        supportingText: { text: 'In Meeting', variant: 'default' },
      },
      {
        id: 'user-14',
        title: 'Rachel Green',
        upperSupportingText: 'Art Teacher',
        avatar: { fullName: 'Rachel Green' },
        supportingText: { text: 'Critical', variant: 'danger' },
      },
      {
        id: 'user-15',
        title: 'Mark Thompson',
        upperSupportingText: 'Security',
        avatar: { fullName: 'Mark Thompson' },
        supportingText: { text: 'Info Update', variant: 'default' },
      },
    ];

    this.actionListService.show({
      title: 'Select User',
      items: userItems,
      onItemAction: (item) => {
        this.toast.success(`Selected: ${item.title}`, 'User Selection');
      },
    });
  }
}
