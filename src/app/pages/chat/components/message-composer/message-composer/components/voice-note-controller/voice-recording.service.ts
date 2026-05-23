import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Microphone } from '@mozartec/capacitor-microphone';
import { Capacitor } from '@capacitor/core';

@Injectable()
export class VoiceRecordingService {
  private readonly audioFileSource$ = new BehaviorSubject<{
    file: File;
    url: string;
  } | null>(null);
  audioFile$ = this.audioFileSource$.asObservable();
  private webMediaRecorder: MediaRecorder | null = null;
  private webRecordedChunks: Blob[] = [];

  constructor() {}

  public async startRecording() {
    if (Capacitor.isNativePlatform()) {
      return this.startMobileRecording();
    }
    return this.startWebRecording();
  }
  public async stopRecording() {
    if (Capacitor.isNativePlatform()) {
      return this.stopMobileRecording();
    }
    return this.stopWebRecording();
  }

  public pauseRecording() {
    if (this.webMediaRecorder && this.webMediaRecorder.state === 'recording') {
      this.webMediaRecorder.pause();
    }
  }

  public resumeRecording() {
    if (this.webMediaRecorder && this.webMediaRecorder.state === 'paused') {
      this.webMediaRecorder.resume();
    }
  }

  private async startWebRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.webMediaRecorder = new MediaRecorder(stream);

    this.webMediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.webRecordedChunks.push(event.data);
      }
    };
    this.webMediaRecorder.start();
  }

  private stopWebRecording() {
    if (!this.webMediaRecorder) return;
    this.webMediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.webRecordedChunks, { type: 'audio/wav' });
      const file = new File([audioBlob], 'audio.mp3', {
        type: 'audio/mp3',
      });

      const url = URL.createObjectURL(audioBlob);
      this.audioFileSource$.next({ file, url });
      this.webRecordedChunks = [];
      this.webMediaRecorder = null;
    };
    this.webMediaRecorder.stop();
  }

  async startMobileRecording() {
    const permissionResult = await Microphone.checkPermissions();
    let requestPermissionResult;
    if (permissionResult.microphone === 'prompt') {
      requestPermissionResult = await Microphone.requestPermissions();
    }
    if (
      permissionResult.microphone === 'granted' ||
      requestPermissionResult?.microphone === 'granted'
    ) {
      await Microphone.startRecording();
    }
  }

  async stopMobileRecording() {
    try {
      const recording = await Microphone.stopRecording();
      if (recording.dataUrl) {
        const resp = await fetch(recording.dataUrl);
        const blob = await resp.blob();
        const file = new File([blob], 'audio.mp3', {
          type: 'audio/mp3',
        });
        this.audioFileSource$.next({ file, url: recording.dataUrl });
      }
    } catch (error) {
      console.error('recordingResult Error: ' + JSON.stringify(error));
    }
  }
}
