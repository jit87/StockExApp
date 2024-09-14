import { Component, OnInit, Output } from '@angular/core';
import { StockService } from '../../services/stock.service';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../interfaces/Empresa';
import { Router } from '@angular/router';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/web-socket-service.service';


@Component({
  selector: 'app-contenido',
  templateUrl: './contenido.component.html',
})
export class ContenidoComponent {
  symbol = ''; 
  stockQuote: any;
  StockPrice: number | undefined;
  total: number | undefined; 
  listEmpresas: any[] = [];
  totalAcciones: number | undefined;
  Empresa: Empresa | undefined; 
  chart: any;
  sectorData: { label: string; value: number }[] = [];

  //Variable para controlar la visibilidad del formulario de edición
  mostrarFormularioEdicion: boolean = false;
  mostrarFormularioEdicion2: boolean = false;

  //Variable para pasarle al hijo el id
  empresaIdSeleccionada: string | undefined;

  //Variable para controlar si mostramos el contenido en función de la autenticación
  autenticado: boolean = false; 

  //Variable para almacenar usuario logueado
  usuario: any; 

  //Variable para actualizar precios
  precios: any[] = [];

  constructor(
    private stockService: StockService,
    public empresaService: EmpresaService,
    private router: Router,
    private toastr: ToastrService,
    private _authService: AuthService,
    private _webSocketService: WebSocketService
  ) {
    this.getUsuario();
    this.getEmpresas(); 
    
  }


 ngOnInit(): void {
    this.getUsuario();
    this.getEmpresas();
   
   // Subscribirse a las actualizaciones de precios
   this._webSocketService.getPriceUpdates().subscribe(
     (resp: any) => {
       console.log(resp);
     }
   )
  }



  // ACCIONES Y CALCULOS

  async getEmpresas(): Promise<void> {
    //Si está autenticado mostramos las acciones que tiene
    if (this._authService.isAuthenticated()) { 
      this.autenticado = true; 

      const usuarioId: any = localStorage.getItem('id'); 
      this.empresaService.getListEmpresas(usuarioId).subscribe(
        (resp: any) => {
          this.listEmpresas = resp;
          this.calcularTotalInvertido();
        },
        //Si no mostramos el error y redirigimos al login
        (error: any) => {
          console.log(error);
          this.router.navigate(['/login']);
        }
      );
    }  
  }

  async eliminarAccion(empresa: Empresa) {
    if (confirm("¿Estás seguro de que deseas eliminar esta acción?")) {
      console.log(empresa); 
      this.empresaService.deleteEmpresa(empresa).subscribe(
        (resp: any) => {
          this.listEmpresas = resp;
          this.getEmpresas(); 
          this.toastr.info('La acción ha sido eliminada', 'Acción eliminada');
        },
        (error: any) => {
          console.log(error);
        }
      );
    } 
  }

  async calcularTotalInvertido() {
    try {
      let total = 0;
      this.listEmpresas.forEach(element => {
        total += element.capitalInvertido || 0;
      });
      this.totalAcciones = total;
    } catch (error) {
      console.error('Error al obtener las empresas:', error);
    }
  }



  // FORMULARIOS

  mostrarFormulario() {
    this.mostrarFormularioEdicion = true;
  }

  cerrarFormulario() {
    this.mostrarFormularioEdicion = false;
  }

  mostrarFormulario2(id: string) {
    this.empresaIdSeleccionada = id;
    this.mostrarFormularioEdicion2 = true;
  }

  cerrarFormulario2() {
    this.mostrarFormularioEdicion2 = false;
    this.getEmpresas(); 
  }

  // Recepción de datos del hijo formulario de edición
  recibirValor(siAgregada: boolean) {
    if (siAgregada) {
      this.getEmpresas(); 
    }
  }



  // CONSULTAS
  
  getInfoEmpresa(ticker: string) {
    this.router.navigate(['/buscar', ticker]);
  }


  getUsuario() {
    var email = localStorage.getItem('email'); 
    this._authService.getUserByEmail(email).subscribe(
      (resp: any) => {
        this.usuario = resp; 
        localStorage.setItem('id', this.usuario._id); 
      }
    )
  }




}
