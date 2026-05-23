import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  faChevronDown,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';

@Component({
  selector: 'app-icon-card',
  templateUrl: './icon-card.component.html',
  standalone: true,
  imports: [DsIconComponent],
  host: { class: 'block' },
})
export class IconCardComponent {
  @Input() title = '';
  @Input() icon?: DsIcon;
  @Input() showTrailingChevron = true;
  @Input() trailingChevronDirection: 'right' | 'down' = 'right';
  @Input() interactive = true;
  @Output() cardClick = new EventEmitter<void>();

  get chevronIcon(): DsIcon {
    return this.trailingChevronDirection === 'down'
      ? faChevronDown
      : faChevronRight;
  }

  onCardClick() {
    if (!this.interactive) {
      return;
    }

    this.cardClick.emit();
  }
}
