import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: any;
  private url: string = 'http://localhost:4000';

  constructor() {
    this.socket = io(this.url, {
      transports: ['websocket'],
      autoConnect: true
    });
  }

  getPriceUpdates(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('priceUpdate', (data: any) => {
        console.log('Datos recibidos de WebSocket', data);
        observer.next(data);
      });

      return () => {
        this.socket.off('priceUpdate');
      };
    });
  }
}
