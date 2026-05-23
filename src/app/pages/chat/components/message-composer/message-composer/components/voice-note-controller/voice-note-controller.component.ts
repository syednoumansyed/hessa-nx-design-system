import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  output,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';

import { VoiceRecordingService } from './voice-recording.service';
import { HesSubscription } from '@shared/utils/hes-subscription.util';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faTrash,
  faPaperPlaneTop,
  faStopCircle,
  faPause,
  faPlay,
} from '@fortawesome/pro-regular-svg-icons';
import { isRtl } from '@shared/utils/platform';

@Component({
  selector: 'app-voice-note-controller',
  templateUrl: './voice-note-controller.component.html',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  providers: [VoiceRecordingService],
})
export class VoiceNoteControllerComponent implements OnInit, OnDestroy {
  delete = output<boolean>();
  send = output<File>();

  faSendIcon = faPaperPlaneTop;
  faStopIcon = faStopCircle;
  faTrashIcon = faTrash;
  faPauseIcon = faPause;
  faPlayIcon = faPlay;

  audioUrl: string | null = null;
  audioFile: File | null = null;

  isRtl = isRtl();

  isPaused = signal<boolean>(false);
  isPlaying = false;
  progress = 0;
  formattedTime = '0:00';
  recordingTimeInSeconds = 0;
  levels: number[] = [];
  private cap = 40;
  private readonly BAR_W = 3;
  private readonly BAR_G = 3;
  private ro?: ResizeObserver;
  private waveformId: any;

  private readonly cd = inject(ChangeDetectorRef);
  private readonly voiceRecordingService = inject(VoiceRecordingService);
  private readonly subscription = new HesSubscription();

  private timerId: any;

  @ViewChild('player') playerRef: ElementRef<HTMLAudioElement>;
  @ViewChild('liveWave', { static: false })
  liveWave!: ElementRef<HTMLDivElement>;

  constructor() {}

  ngOnInit(): void {
    this.startRecording();
  }

  ngAfterViewInit() {
    this.ro = new ResizeObserver(() => this.recalcCap());
    this.ro.observe(this.liveWave.nativeElement);
    this.recalcCap();
  }

  private recalcCap() {
    const el = this.liveWave?.nativeElement;
    if (!el) return;
    const w = el.clientWidth;
    const next = Math.max(1, Math.floor(w / (this.BAR_W + this.BAR_G)));
    if (next === this.cap) return;
    if (next > this.cap) {
      const last = this.levels[this.levels.length - 1] ?? 0;
      this.levels.push(...Array(next - this.cap).fill(last));
    } else {
      this.levels.splice(0, this.levels.length - next);
    }
    this.cap = next;
  }

  trackByIndex(i: number) {
    return i;
  }

  private startRecording() {
    this.voiceRecordingService.startRecording();
    this.startTimer();
    this.startWaveform();
    this.subscription.add = this.voiceRecordingService.audioFile$.subscribe(
      (audioFile) => {
        if (!audioFile) return;
        this.audioFile = audioFile.file;
        this.audioUrl = audioFile.url;
        this.formattedTime = this.formatTime(this.recordingTimeInSeconds);
        this.clearTimer();
        this.stopWaveform();
        this.cd.detectChanges();
      },
    );
  }

  async stopRecording() {
    this.voiceRecordingService.stopRecording();
    this.clearTimer();
    this.stopWaveform();
  }

  togglePause() {
    if (this.audioUrl) return;
    if (this.isPaused()) {
      this.voiceRecordingService.resumeRecording();
      this.startTimer();
    } else {
      this.voiceRecordingService.pauseRecording();
      this.clearTimer();
    }
    this.isPaused.set(!this.isPaused());
  }

  togglePlayback(player?: HTMLAudioElement) {
    const audioEl = this.playerRef?.nativeElement || player;
    if (!this.audioUrl || !audioEl) return;
    if (this.isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
  }

  onTimeUpdate(player?: HTMLAudioElement) {
    const audioEl = this.playerRef?.nativeElement || player;
    if (!audioEl || !audioEl.duration) return;
    this.progress = (audioEl.currentTime / audioEl.duration) * 100;
    this.formattedTime = this.formatTime(Math.floor(audioEl.currentTime));
  }

  onPlaybackEnded() {
    this.isPlaying = false;
    const audioEl = this.playerRef?.nativeElement;
    if (audioEl?.duration) {
      const total = Math.floor(audioEl.duration);
      this.formattedTime = this.formatTime(total);
    }
  }

  seek(event: MouseEvent, player?: HTMLAudioElement) {
    const audioEl = this.playerRef?.nativeElement || player;
    if (!audioEl || !audioEl.duration) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    audioEl.currentTime = Math.max(
      0,
      Math.min(audioEl.duration * ratio, audioEl.duration),
    );
  }

  onSend() {
    if (this.audioFile) {
      this.send.emit(this.audioFile);
    } else {
      this.subscription.add = this.voiceRecordingService.audioFile$.subscribe(
        (payload) => {
          if (payload?.file) {
            this.send.emit(payload.file);
          }
        },
      );
      this.stopRecording();
    }
  }

  onDelete() {
    this.voiceRecordingService.stopRecording();
    this.delete.emit(true);
  }

  private startTimer() {
    this.clearTimer();
    this.timerId = setInterval(() => {
      this.recordingTimeInSeconds++;
      this.formattedTime = this.formatTime(this.recordingTimeInSeconds);
      this.cd.markForCheck();
    }, 1000);
  }

  private clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startWaveform() {
    this.stopWaveform();
    this.waveformId = setInterval(() => {
      if (this.isPaused()) return;

      const v = 20 + Math.random() * 80;
      this.levels.unshift(v);
      if (this.levels.length > this.cap) this.levels.pop();
    }, 100);
  }

  private stopWaveform() {
    if (this.waveformId) {
      clearInterval(this.waveformId);
      this.waveformId = null;
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  ngOnDestroy(): void {
    this.voiceRecordingService.stopRecording();
    this.subscription.unsubscribe();
    this.clearTimer();
    this.stopWaveform();
    this.ro?.disconnect();
  }
}
