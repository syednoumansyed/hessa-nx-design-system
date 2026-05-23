import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsButtonComponent } from '@ds/button/button.component';

@Component({
  selector: 'app-mobile-entry-shell',
  standalone: true,
  imports: [TranslocoDirective, DsButtonComponent],
  templateUrl: './mobile-entry-shell.component.html',
  styleUrls: ['./mobile-entry-shell.component.scss'],
})
export class MobileEntryShellComponent {
  @Input() mascotImage = '';
  @Input() speechBubbleMessage = '';
  @Input() continueDisabled = false;
  @Input() continueLoading = false;
  @Output() continueClick = new EventEmitter<void>();
}
