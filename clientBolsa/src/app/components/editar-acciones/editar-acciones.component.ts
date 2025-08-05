import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Empresa } from '../../interfaces/Empresa';
import { lastValueFrom } from 'rxjs';
import { ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AbstractStockService } from '../../abstracts/AbstractStockService';
import { AbstractAuthService } from '../../abstracts/AbstractAuthService';
import { AbstractEmpresaService } from '../../abstracts/AbstractEmpresaService';



@Component({
  selector: 'app-editar-acciones',
  templateUrl: './editar-acciones.component.html',
})
export class EditarAccionesComponent implements OnInit {

  agregarAccion: FormGroup | any;
  StockPrice: number | undefined;
  per: number | undefined;
  industria: string | undefined;
  @ViewChild('buscarTexto') buscarTexto: HTMLInputElement | undefined;

  //Comunicamos al padre (contenido) que se ha agregado la acción
  @Output() empresaAgregada = new EventEmitter<boolean>();

  // Evento para notificar el cierre del formulario
  @Output() cerrarFormulario = new EventEmitter<void>();

  //Variable para comunicar al padre (contenido.component) que se ha agregado una empresa en el hijo (formulario)
  siAgregada: boolean = true;

  //Spinner
  loading: boolean = false;

  usuario_Id: any;

  //Variable para guardar empresas filtradas en el buscador
  empresasFiltradas: string[] = [];

  isOpen = false;

  constructor(private fb: FormBuilder,
    private empresaService: AbstractEmpresaService,
    private stockService: AbstractStockService,
    private toastr: ToastrService,
    private _authService: AbstractAuthService) {
    this.agregarAccion = this.fb.group({
      nombre: ['', Validators.required],
      ticker: ['', Validators.required],
      numero: [0, [Validators.required, Validators.minLength(1), Validators.min(1)]]
    });

    this.getUsuario();
  }




  ngOnInit(): void {
    this.getUsuario();
  }



  //ACCIONES Y CALCULOS

  async addAccion() {
    this.loading = true;

    //Marca los errores si no se han completado el campo nombre
    if (this.agregarAccion.get('nombre')?.invalid) {
      this.agregarAccion.get('nombre')?.markAsTouched();
      return;
    }
    if (this.agregarAccion.valid) {
      try {
        const ticker = this.agregarAccion.get('ticker')?.value.toUpperCase();
        const precioObservable = this.stockService.getPrice(ticker);
        const precio = await lastValueFrom(precioObservable);
        const industriaObservable = this.stockService.getIndustry(ticker);
        this.industria = await lastValueFrom(industriaObservable);

        //const perObservable = this.stockService.getPER(ticker);
        //this.per = await lastValueFrom(perObservable);

        const nuevaEmpresa: Empresa = {
          nombre: this.agregarAccion.get('nombre')?.value,
          ticker: ticker,
          precio: precio,
          cantidad: this.agregarAccion.get('numero')?.value || 0,
          //per: this.per,
          capitalInvertido: (this.agregarAccion.get('numero')?.value || 0) * precio,
          industria: this.industria,
          usuarioId: this.usuario_Id,
          valoracion: (this.agregarAccion.get('numero')?.value || 0) * precio
        };

        //Siempre hay que suscribirse a los observables para que funcione bien la recepción de datos
        this.empresaService.addEmpresa(nuevaEmpresa).subscribe(
          (resp: any) => {
            console.log(resp);
          },
          (error) => {
            console.log(error);
          }
        );

        //Reinicia el formulario después de agregar una acción con éxito
        this.agregarAccion.reset();
        this.empresaAgregada.emit(this.siAgregada);
        this.toastr.success('La acción ha sido añadida', 'Acción añadida');
        this.loading = false;

      } catch (error) {
        console.error('Error al obtener el precio de la acción', error);
      }
    } else {
      console.error('Formulario no válido. No se puede proceder.');
    }

    //Evita que el formulario se envíe automáticamente
    return false;
  }




  updateInput(nombreEmpresa: string): void {
    this.agregarAccion?.get('nombre')?.setValue(nombreEmpresa, { emitEvent: false });
    this.isOpen = false;
  }




  cerrar() {
    this.cerrarFormulario.emit();
  }


  searchEmpresa(nombre: string): void {
    if (nombre.length < 3) {
      this.empresasFiltradas = [];
      return;
    }

    this.stockService.getName(nombre).subscribe({
      next: resultado => {
        console.log('Resultado de la búsqueda:', resultado);
        if (resultado && resultado.length > 0) {
          this.empresasFiltradas = [resultado];
          this.isOpen = true;
        } else {
          this.empresasFiltradas = [];
          this.isOpen = false;
        }
      },
      error: error => {
        console.error('Error al obtener el nombre de la empresa:', error);
        this.empresasFiltradas = [];
        this.isOpen = false;
      }
    });
  }


  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.mb-3')) {
      this.isOpen = false;
    }
  }



  toggle() {
    this.isOpen = !this.isOpen;
  };




  getUsuario() {
    var email = localStorage.getItem('email');
    console.log(email);
    this._authService.getUserByEmail(email).subscribe(
      (resp: any) => {
        this.usuario_Id = resp._id;
      }
    )
  }





  //Validación de los datos introducidos en el formulario
  get accionesNoValidas() {
    return this.agregarAccion.get('numero').invalid && this.agregarAccion.get('numero').touched;
  }

  get tickerNoValido() {
    return this.agregarAccion.get('ticker').invalid && this.agregarAccion.get('ticker').touched;
  }

  get nombreNoValido() {
    return this.agregarAccion.get('nombre').invalid && this.agregarAccion.get('nombre').touched;
  }







}
