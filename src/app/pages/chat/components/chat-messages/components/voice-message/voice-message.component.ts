import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '@cometchat/chat-sdk-javascript';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faPause, faPlay } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-voice-message',
  templateUrl: './voice-message.component.html',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
})
export class VoiceMessageComponent implements OnInit, AfterViewInit {
  message = input.required<BaseMessage>();
  faPauseIcon = faPause;
  faPlayIcon = faPlay;

  @ViewChild('audio', { static: true }) audio!: ElementRef<HTMLAudioElement>;
  @ViewChild('track', { static: true }) track!: ElementRef<HTMLElement>;

  isPlaying = false;
  duration = 0;
  currentTime = 0;
  playedIndex = 0;

  readonly levels: number[] = [
    15, 25, 45, 65, 85, 70, 40, 20, 35, 55, 80, 60, 30, 50, 75, 90, 65, 35, 20,
    40, 25, 60, 45, 70, 30, 85, 50, 75, 40, 65,
  ];

  messageUrl = computed(() => this.message().getData().url);

  ngOnInit() {}

  ngAfterViewInit() {
    if (this.audio?.nativeElement) {
      this.currentTime = 0;
    }
  }

  toggle() {
    const a = this.audio.nativeElement;
    if (this.isPlaying) a.pause();
    else a.play();
    this.isPlaying = !this.isPlaying;
  }

  private effectiveDuration(a: HTMLAudioElement): number {
    const d = a.duration;
    if (Number.isFinite(d) && d > 0) return d;

    const r = a.seekable;
    if (r && r.length) {
      const end = r.end(r.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    }

    const b = a.buffered;
    if (b && b.length) {
      const end = b.end(b.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    }
    return 0;
  }

  init() {
    const a = this.audio.nativeElement;
    this.duration = this.effectiveDuration(a);
  }

  tick() {
    const a = this.audio.nativeElement;
    this.currentTime = Number.isFinite(a.currentTime) ? a.currentTime : 0;

    const d = this.effectiveDuration(a);
    if (d > 0) this.duration = d;

    const dur = this.duration;
    this.playedIndex = dur
      ? Math.min(
          this.levels.length - 1,
          Math.floor((this.currentTime / dur) * this.levels.length),
        )
      : 0;
  }

  seek(e: MouseEvent) {
    const a = this.audio.nativeElement;
    if (a.readyState < 1) return;

    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const width = rect.width || 1;
    let ratio = (e.clientX - rect.left) / width;

    if (!Number.isFinite(ratio)) return;
    ratio = Math.min(Math.max(ratio, 0), 1);

    const dur = this.effectiveDuration(a);
    if (!Number.isFinite(dur) || dur <= 0) return;

    const t = ratio * dur;
    if (!Number.isFinite(t)) return;

    a.currentTime = t;
    this.tick();
  }

  formatTime(sec: number) {
    if (!Number.isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  }
}
