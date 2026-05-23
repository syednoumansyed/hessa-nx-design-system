import { Component, inject, input, signal } from '@angular/core';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { ThemeManagerService } from '@shared/services/theme-manager.service';

@Component({
  selector: 'app-demo-page-wrapper',
  standalone: true,
  imports: [DsButtonComponent],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <h1 class="heading-h1-high-emphasis">{{ title() }}</h1>
      <ds-button variant="tertiary" size="sm" (click)="toggleTheme()">
        {{ isTeacherView() ? 'Teacher View' : 'Student View' }}
      </ds-button>
    </div>
    <ng-content />
  `,
})
export class DemoPageWrapperComponent {
  title = input<string>('');

  private themeControl = inject(ThemeManagerService);
  isTeacherView = signal(false);

  constructor() {
    this.isTeacherView.set(this.themeControl.getRole() === 'personnel');
  }

  toggleTheme() {
    this.isTeacherView.update((v) => !v);
    if (this.isTeacherView()) {
      this.themeControl.setPersonnel();
    } else {
      this.themeControl.setStudent();
    }
  }
}
