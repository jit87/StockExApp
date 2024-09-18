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
    //Obtener el token JWT y el ID del usuario
    const token = localStorage.getItem('auth-token');
    const userId = localStorage.getItem('user-id');
    const email = localStorage.getItem('email'); 


    //Conectar con el WebSocket e incluir el token y el ID del usuario
    this.socket = io(this.url, {
      transports: ['websocket'],
      auth: {
        token: token,
        userId: userId,
        email: email
      }
    });

    //Manejar la conexión exitosa
    this.socket.on('connect', () => {
      console.log('Conectado al WebSocket');
    });
  }

  

  //Método para obtener actualizaciones de precios
  getPriceUpdates() {
    return new Observable((observer) => {
      this.socket.on('priceUpdate', (data: any) => {
        observer.next(data);
      });
    });
  }
}
