import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { provideIcons } from '@ng-icons/core';
import { saxAddOutline } from '@ng-icons/iconsax/outline';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';

@Component({
  selector: 'app-setup-card',
  templateUrl: './setup-card.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, DsButtonComponent, RbacDirective],
  viewProviders: [
    provideIcons({
      saxAddOutline,
    }),
  ],
})
export class SetupCardComponent {
  cardData = input<{
    title: string;
    description: string;
    btnText: string;
    imagePath: string;
    showButton: boolean;
  }>();

  btnClick = output<void>();
  permissionId = input<number>();

  onButtonClick() {
    this.btnClick.emit();
  }
}
