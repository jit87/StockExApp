import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: any;
  private url: string = 'http://localhost:4000';

  constructor() {
    this.socket = io(this.url);

    // Enviar el ID del usuario después de la conexión
    const userId = localStorage.getItem('id');
    if (userId) {
      this.socket.emit('setUserId', userId);
    }
  }

  getPriceUpdates() {
    return new Observable((observer) => {
      this.socket.on('priceUpdate', (data: any) => {
        observer.next(data);
      });
    });
  }
}
