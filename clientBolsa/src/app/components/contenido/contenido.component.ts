import { ChangeDetectorRef, Component, OnInit, Output, ViewChild } from '@angular/core';
import { StockService } from '../../services/stock.service';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../interfaces/Empresa';
import { Router } from '@angular/router';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { GraficaSectoresComponent } from '../../alonecomponents/grafica-sectores/grafica-sectores.component';
import { GraficaSupersectoresComponent } from '../../alonecomponents/grafica-supersectores/grafica-supersectores.component';


@Component({
  selector: 'app-contenido',
  templateUrl: './contenido.component.html',
  styleUrl: './contenido.component.css'
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

  //Variables para controlar si sube el valor de la inversión
  haSubido: number = 0; 
  mayorValor: number = 0; 

  //Variable que mide lo que valen las acciones en la actualidad
  totalValoracion: any; 

  //Variables para acceder a las gráficas dependientes
  @ViewChild(GraficaSectoresComponent) graficaSectoresComponent!: GraficaSectoresComponent;
  @ViewChild(GraficaSupersectoresComponent) graficaSupersectoresComponent!: GraficaSupersectoresComponent;


  constructor(
    public empresaService: EmpresaService,
    private router: Router,
    private toastr: ToastrService,
    private _authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.getUsuario();
    this.getEmpresas(); 
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
        this.calcularValorInvertido(); 
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
  Swal.fire({
    html:
      `<form id="eliminarAccionForm" style="max-width: 500px; margin: auto; border: solid 1px lightblue; padding: 20px; background-color:#343a40; position: relative;">
        <div style="color: white; text-align: center;">
          <p>¿Estás seguro de que deseas eliminar esta acción?</p>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <button id="confirmar" type="button" class="btn btn-primary" style="margin-right: 10px;">Sí, eliminar</button>
          <button id="cancelar" type="button" class="btn btn-danger">Cancelar</button>
        </div>
      </form>`,
    showConfirmButton: false, 
    showCancelButton: false,
    background: 'transparent',
    customClass: {
      popup: 'sweet-fade-in', 
    }
  });
  document.getElementById('confirmar')?.addEventListener('click', () => {
    this.empresaService.deleteEmpresa(empresa).subscribe(
      (resp: any) => {
        this.listEmpresas = resp;
        this.getEmpresas(); 
        this.eliminarDividendo(empresa.ticker); 
        this.toastr.info('La acción ha sido eliminada', 'Acción eliminada');
        Swal.close();
        this.actualizarGraficas();
      },
      (error: any) => {
        console.log(error);
      }
    );
  });
  document.getElementById('cancelar')?.addEventListener('click', () => {
    Swal.close();
  });
  }
  

  //Elimina los dividendos asociados a una acción
  eliminarDividendo(ticker: string): void {
      const dividendosAlmacenados = localStorage.getItem('dividendos');
      if (dividendosAlmacenados) {
          const dividendos = JSON.parse(dividendosAlmacenados);
        const dividendosActualizados = dividendos.filter((dividendo: any) => dividendo.ticker !== ticker);
          localStorage.removeItem('dividendos'); 
          localStorage.setItem('dividendos', JSON.stringify(dividendosActualizados));
      }
  }
    
  
  //Dinero que costaron las acciones y su valor actual
  async calcularTotalInvertido() {
    try {
      let total = 0;
      let totalValoracion = 0; 
      this.listEmpresas.forEach(empresa => {
        total += empresa.capitalInvertido || 0;
        empresa.valoracion = (empresa.cantidad * empresa.precio);
        totalValoracion = totalValoracion + empresa.valoracion; 
      });
      this.totalAcciones = total;
      this.totalValoracion = totalValoracion; 

      if (this.totalValoracion > this.totalAcciones) {
        this.mayorValor = 1; 
      } else if (this.totalValoracion < this.totalAcciones) {
        this.mayorValor = -1;   
      } else {
        this.mayorValor = 0;
      }
    } catch (error) {
      console.error('Error al obtener las empresas:', error);
    }
  }


  //Función que calcula el valor de la inversión de cada acción, la variación del valor y el total de lo que valen las acciones
  async calcularValorInvertido() {
    const usuarioId: any = localStorage.getItem('id');
      this.empresaService.getListEmpresas(usuarioId).subscribe(
          (resp: any) => {
            this.listEmpresas.map((empresa: any) => {
              empresa.valoracion = empresa.cantidad * empresa.precio;
              if (empresa.valoracion > empresa.capitalInvertido) {
                empresa.haSubido = 1; 
                empresa.variacion = ((empresa.valoracion - empresa.capitalInvertido) / empresa.capitalInvertido) * 100;    
              } else if (empresa.valoracion < empresa.capitalInvertido) {
                empresa.haSubido = -1; 
                empresa.variacion = ((empresa.valoracion - empresa.capitalInvertido) / empresa.capitalInvertido) * 100; 
              } else {
                empresa.haSubido = 0;  
                empresa.variacion = 0; 
              }
              //Actualizamos la valoración en la bbdd
              this.actualizarValorInversion(empresa); 
          });
      });
  }


   actualizarValorInversion(empresa: Empresa) {
     this.empresaService.updateEmpresa(empresa, empresa._id).subscribe(
        (resp: any) => {
          console.log('Valor de la empresa actualizado correctamente:', resp);
          this.cdr.detectChanges(); 
        },
        (error: any) => {
          console.error('Error al actualizar el valor de la inversión:', error);
        }
      ); 
        this.cdr.detectChanges();
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

  //Recepción de datos del hijo formulario de edición
  recibirValor(siAgregada: boolean) {
    if (siAgregada) { 
      this.getEmpresas(); 
      this.actualizarGraficas(); 
    }
  }

  //Recepción de datos del hijo formulario de modificación
  recibirValor2(siModificada: boolean) {
    if (siModificada) { 
      this.getEmpresas(); 
      this.actualizarGraficas(); 
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

  //Función que actualiza los datos de las gráficas dependientes
  actualizarGraficas() {
    this.graficaSectoresComponent.loadData();
    this.graficaSupersectoresComponent.loadData();
  }




}
