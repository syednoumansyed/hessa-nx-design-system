import { inject, Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HesToasterService } from './hes-toaster.service';
import { isDevEnvironment } from '@shared/utils/env.util';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private readonly toasterService = inject(HesToasterService);

  connect(): void {
    if (this.socket && this.socket.ioSocket.connected) {
      console.log('Socket already connected');
      if (isDevEnvironment()) {
        this.toasterService.info('Socket already connected');
      }
      return;
    }

    const url = environment.SOCKET_BASE_URL;

    const authToken = localStorage.getItem('accessToken');

    const config: SocketIoConfig = {
      url: url,
      options: {
        extraHeaders: authToken ? { Authorization: authToken } : {},
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        withCredentials: true,
      },
    };

    this.socket = new Socket(config);

    this.socket.connect();

    this.socket.fromEvent('connect').subscribe(() => {
      console.log('Connected to Socket.IO server');
      if (isDevEnvironment()) {
        this.toasterService.success('Socket connected');
      }
    });

    this.socket.fromEvent('disconnect').subscribe(() => {
      console.log('Disconnected from Socket.IO server');
      if (isDevEnvironment()) {
        this.toasterService.warning('Socket disconnected');
      }
    });

    this.socket.fromEvent('connect_error').subscribe((error: any) => {
      console.error('Socket connection error:', error);
      if (isDevEnvironment()) {
        const errorMessage = error?.message || String(error) || 'Unknown error';
        this.toasterService.error('Socket connection error', errorMessage);
      }
    });

    this.socket.fromEvent('connect_timeout').subscribe((error: any) => {
      console.warn('Socket connection timed out:', error);
      if (isDevEnvironment()) {
        const errorMessage =
          error?.message || String(error) || 'Connection timed out';
        this.toasterService.error('Socket connection timeout', errorMessage);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      console.log('Socket disconnected manually');
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  listen<T>(event: string): Observable<T> {
    return this.socket ? this.socket.fromEvent<T>(event) : new Observable<T>();
  }

  removeListener(event: string): void {
    if (this.socket) {
      this.socket.removeListener(event);
    }
  }
}
