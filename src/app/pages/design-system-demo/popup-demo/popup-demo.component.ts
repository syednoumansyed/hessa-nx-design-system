import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsMenuComponent } from '@ds/popup/ds-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { saxTickCircleOutline } from '@ng-icons/iconsax/outline';
import { provideIcons } from '@ng-icons/core';
import { DsButtonComponent } from '@ds/button/button.component';

@Component({
  selector: 'app-popup-usage-example',
  standalone: true,
  imports: [CommonModule, DsMenuComponent, DsButtonComponent],
  template: `
    <ds-menu
      #dsMenu
      [items]="complexDropdownItems"
      [selectedValues]="selectedValues"
      (itemSelected)="onItemSelected($event)"
      (selectedItemsChange)="onSelectedItemsChange($event)"
    >
      <ds-button variant="primary" type="button" class="mt-4">
        Settings Menu
      </ds-button>
    </ds-menu>
  `,
  viewProviders: [
    provideIcons({
      saxTickCircleOutline,
    }),
  ],
})
export class UsagePopupExampleComponent implements AfterViewInit {
  @ViewChild('dsMenu') dsMenu!: DsMenuComponent;

  selectedValues = ['french', 'light', 'documentation'];
  currentSelections: PopupItem[] = [];

  ngAfterViewInit() {
    setTimeout(() => {
      this.currentSelections = this.dsMenu.getSelectedItems();
    });
  }

  complexDropdownItems: PopupItem[] = [
    {
      id: 'account',
      title: 'global.menu.title',
      subtitle: 'User settings',
      icon: 'saxTickCircleOutline',
      children: [
        {
          id: 'profile',
          title: 'Profile',
          subtitle: 'Edit your profile',
          icon: 'saxTickCircleOutline',
        },
        {
          id: 'security',
          title: 'Security',
          subtitle: 'Password & 2FA',
          icon: 'saxTickCircleOutline',
          children: [
            {
              id: 'change-password',
              title: 'Change Password',
              icon: 'saxTickCircleOutline',
              state: 'danger',
            },
            {
              id: 'two-factor',
              title: 'Two-Factor Auth',
              icon: 'saxTickCircleOutline',
              state: 'success',
            },
          ],
        },
        {
          id: 'preferences',
          title: 'Preferences',
          icon: 'saxTickCircleOutline',
          children: [
            {
              id: 'theme',
              title: 'Theme',
              icon: 'saxTickCircleOutline',
              children: [
                {
                  id: 'light',
                  title: 'Light',
                },
                {
                  id: 'dark',
                  title: 'Dark',
                },
                {
                  id: 'auto',
                  title: 'Auto',
                },
              ],
            },
            {
              id: 'language',
              title: 'Language',
              icon: 'saxTickCircleOutline',
              children: [
                {
                  id: 'english',
                  title: 'English',
                },
                {
                  id: 'spanish',
                  title: 'Spanish',
                },
                {
                  id: 'french',
                  title: 'French',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'help',
      title: 'Help',
      icon: 'saxTickCircleOutline',
      children: [
        {
          id: 'documentation',
          title: 'chats.documents.title',
          icon: 'saxTickCircleOutline',
        },
        {
          id: 'support',
          title: 'enum.HELP_AND_SUPPORT',
          icon: 'saxTickCircleOutline',
        },
      ],
    },
    {
      id: 'logout',
      title: 'global.logout.btn',
      icon: 'saxTickCircleOutline',
      state: 'danger',
      action: () => {
        console.log('Logging out...');
      },
    },
  ];

  onItemSelected(item: PopupItem): void {
    this.handleUserSelection(item);
  }

  onSelectedItemsChange(items: PopupItem[]): void {
    this.currentSelections = items;
    this.selectedValues = items.map((item) => item.id!);
  }

  private handleUserSelection(item: PopupItem): void {
    // Check if the item has an action and execute it
    if (item.action) {
      item.action();
    }

    // Handle different selection types
    if (item.id?.includes('language')) {
      console.log('Language changed to:', item.title);
      // this.userService.saveLanguagePreference(item.id);
    }

    if (item.id?.includes('theme')) {
      console.log('Theme changed to:', item.title);
      // this.themeService.setTheme(item.id);
    }

    // Save user preferences
    // this.userService.savePreferences(this.selectedValues);
  }
}
