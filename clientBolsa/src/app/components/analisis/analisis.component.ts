import { Component } from '@angular/core';
import { AbstractAuthService } from '../../abstracts/AbstractAuthService';

@Component({
  selector: 'app-analisis',
  templateUrl: './analisis.component.html',
  styleUrl: './analisis.component.css'
})
export class AnalisisComponent {

  //Variable para controlar si mostramos el contenido en función de la autenticación
  autenticado: boolean = false;

  constructor(private _authService: AbstractAuthService) {
    if (this._authService.isAuthenticated()) {
      this.autenticado = true;
    }
  }

}
