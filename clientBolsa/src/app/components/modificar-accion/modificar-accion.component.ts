import { Component, EventEmitter, Output, Input, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Empresa } from '../../interfaces/Empresa';
import { ToastrService } from 'ngx-toastr';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { AbstractEmpresaService } from '../../abstracts/AbstractEmpresaService';

@Component({
  selector: 'app-modificar-accion',
  templateUrl: './modificar-accion.component.html',
  styleUrl: './modificar-accion.component.css'
})
export class ModificarAccionComponent {


  modificarAccion: { nombre: string; ticker: string; precio: number; numero: number } = {
    nombre: '',
    ticker: '',
    precio: 0,
    numero: 0
  };

  //Recibimos id del padre (contenido-component)
  @Input() empresaId: string | undefined;

  //Creamos una variable para guardar el dato anterior
  id: string = "";

  // Evento para notificar el cierre del formulario
  @Output() cerrarFormulario2 = new EventEmitter<void>();

  empresaGuardada: Empresa | undefined;

  //Evento para notificar que se modifica una empresa
  @Output() empresaModificada = new EventEmitter<boolean>();

  //Variable para comunicar al padre (contenido.component) que se ha modificado una empresa en el hijo (formulario)
  siModificada: boolean = true;



  constructor(private fb: FormBuilder,
    private empresaService: AbstractEmpresaService,
    private toastr: ToastrService
  ) {
    this.cargarDatos();
  }


  //Recibe el valor del padre cuando se produce algún cambio en @Input() empresaId
  ngOnChanges(changes: SimpleChanges) {
    if (changes['empresaId'] && this.empresaId) {
      console.log('ID recibido:', this.empresaId);
      this.id = this.empresaId;
      this.cargarDatos();
    }
  }



  cerrar() {
    this.cerrarFormulario2.emit();
  }



  cargarDatos() {
    this.empresaService.getEmpresaById(this.id).subscribe(
      (resp: any) => {
        this.empresaGuardada = resp;
        this.modificarAccion = {
          nombre: resp.nombre,
          ticker: resp.ticker,
          precio: resp.precio,
          numero: resp.cantidad
        };
      },
      (error) => {
        console.error('Error al obtener la empresa:', error);
      }
    );
  }



  //Comprobamos si está la empresa y después actualizadmos
  actualizarAccion() {
    this.empresaService.getEmpresaById(this.id).subscribe(
      (resp: any) => {
        this.empresaGuardada = resp;
        console.log(this.empresaGuardada);
      }
    );
    if (this.empresaGuardada) {
      const empresaActualizada: Empresa = {
        ...this.empresaGuardada!,
        precio: this.modificarAccion.precio,
        cantidad: this.modificarAccion.numero,
        capitalInvertido: this.modificarAccion.precio * this.modificarAccion.numero
      };
      this.empresaService.updateEmpresa(empresaActualizada, this.empresaGuardada._id).subscribe(
        (resp: any) => {
          if (resp)
            this.toastr.success('La acción ha sido actualizada', 'Acción actualizada');
          this.empresaModificada.emit(this.siModificada);
        }, (error) => {
          this.toastr.error('Se ha producido un error', error);
        }
      )
    }
  }








}
