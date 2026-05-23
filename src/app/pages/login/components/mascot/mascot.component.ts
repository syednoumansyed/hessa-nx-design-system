import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  MascotConfig,
  MascotService,
  MascotSituation,
} from '@pages/login/services/mascot.service';
import { NgClass } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-mascot',
  templateUrl: './mascot.component.html',
  styleUrl: './mascot.component.scss',
  imports: [NgClass, TranslocoPipe],
  host: { class: 'block w-full' },
})
export class MascotComponent implements OnInit, OnDestroy {
  mascotConfig = signal<MascotConfig | null>(null);
  mascotImagePath = signal('');

  private destroy$ = new Subject<void>();
  private fallbackImage = 'assets/mascot/default/default.svg';
  private mascot = inject(MascotService);

  ngOnInit(): void {
    this.mascot.mascotConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cfg) => {
        this.mascotConfig.set(cfg);
        // Build image path from current config (userType + situation + context)
        // so the mascot changes automatically whenever the flow state updates.
        this.mascotImagePath.set(this.mascot.getMascotImagePath());
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onImageError(evt: any): void {
    if (evt?.target?.src !== this.fallbackImage) {
      evt.target.src = this.fallbackImage;
    }
  }

  getContainerClasses(): string {
    const base = 'w-full flex items-start gap-3';
    const s = this.mascotConfig()?.situation;
    if (!s) return base;

    if (s === 'error') return `${base} text-red-700`;
    if (s === 'success') return `${base} text-green-700`;
    if (s === 'warning') return `${base} text-yellow-700`;
    return base;
  }

  protected readonly MascotSituation = MascotSituation;
}
