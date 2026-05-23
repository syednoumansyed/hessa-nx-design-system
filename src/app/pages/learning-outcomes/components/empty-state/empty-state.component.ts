import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'app-lo-empty-state',
  templateUrl: './empty-state.component.html',
  standalone: true,
  imports: [CommonModule, IonSpinner],
  host: {
    class: 'flex flex-1',
  },
})
export class LoEmptyStateComponent {
  private readonly hesTranslateService = inject(HesTranslateService);

  @Input() title = this.hesTranslateService.t(
    'learning_outcome.no_data_available.title',
  );
  @Input() description = '';
  @Input() isLoading = false;
}
