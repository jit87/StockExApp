import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { EmpresaService } from '../../services/empresa.service';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-modificar-accion',
  templateUrl: './modificar-accion.component.html',
  styleUrl: './modificar-accion.component.css'
})
export class ModificarAccionComponent {

  editarAccion: any;

  constructor(private fb: FormBuilder, private empresaService: EmpresaService, private stockService: StockService) {
    this.editarAccion = this.fb.group({
      nombre: ['', Validators.required],
      ticker: ['', Validators.required],
      numero: [0, [Validators.required, Validators.minLength(1), Validators.min(1)]]
    });
  }



   // Evento para notificar el cierre del formulario
  @Output() cerrarFormulario2 = new EventEmitter<void>();

  cerrar() {
    this.cerrarFormulario2.emit();
  }
     
     
     

}
