import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { provideIcons } from '@ng-icons/core';
import { saxAddOutline } from '@ng-icons/iconsax/outline';

@Component({
  selector: 'app-setup-banner',
  templateUrl: './setup-banner.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, DsButtonComponent],
  viewProviders: [
    provideIcons({
      saxAddOutline,
    }),
  ],
})
export class SetupBannerComponent {
  bannerData = input<{
    title: string;
    description: string;
  }>();

  btnClick = output<void>();

  onButtonClick() {
    this.btnClick.emit();
  }
}
