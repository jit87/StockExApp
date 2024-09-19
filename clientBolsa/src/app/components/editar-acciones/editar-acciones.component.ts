import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../interfaces/Empresa';
import { StockService } from '../../services/stock.service';
import { lastValueFrom } from 'rxjs';
import { ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';



@Component({
  selector: 'app-editar-acciones',
  templateUrl: './editar-acciones.component.html',
})
export class EditarAccionesComponent  implements OnInit {

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

  constructor(private fb: FormBuilder,
              private empresaService: EmpresaService,
              private stockService: StockService,
              private toastr: ToastrService,
              private _authService: AuthService) {
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

    //Marca los errores si no se han completado los campos
    if (this.agregarAccion.invalid) {
      this.agregarAccion.markAllAsTouched();
      return;
    }
    if (this.agregarAccion.valid) {
      try {
        const ticker = this.agregarAccion.get('ticker')?.value;
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

        // Reinicia el formulario después de agregar una acción con éxito
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

    // Evita que el formulario se envíe automáticamente
    return false;
  }




  updateInput(nombreEmpresa: string): void {
    const nombreActual = this.agregarAccion?.get('nombre')?.value;

    // Actualiza el valor solo si el campo está vacío
    if (!nombreActual) {
      this.agregarAccion?.get('nombre')?.setValue(nombreEmpresa);
    }

  }




  cerrar() {
    this.cerrarFormulario.emit();
  }





  //CONSULTAS

  searchEmpresa(nombre: string): void {
    this.stockService.getName(nombre).subscribe({
      next: resultado => {
        console.log(resultado);
        if (nombre === (this.buscarTexto?.value || '')) {
          this.updateInput(resultado);
        }
      },
      error: error => {
        console.error('Error al obtener el nombre de la empresa:', error);
      }
    });
  }


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
