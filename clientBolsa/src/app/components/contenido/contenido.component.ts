import { Component, OnInit} from '@angular/core';
import { StockService } from '../../services/stock.service';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../interfaces/Empresa';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import '@fortawesome/fontawesome-free/css/all.min.css';



@Component({
  selector: 'app-contenido',
  templateUrl: './contenido.component.html',
})

export class ContenidoComponent implements OnInit  {
  symbol = ''; 
  stockQuote: any;
  StockPrice: number | undefined;
  total: number | undefined; 
  listEmpresas: any[] = [];
  totalAcciones: number | undefined;
  Empresa: Empresa | undefined; 
  
  constructor(
    private stockService: StockService,
    public empresaService: EmpresaService,
    private router: Router
  ) {
    this.getEmpresas();
  }

  chart: any;
  sectorData: { label: string; value: number }[] = [];

  // Variable para controlar la visibilidad del formulario de edición
  mostrarFormularioEdicion: boolean = false;
  mostrarFormularioEdicion2: boolean = false;

  

  async ngOnInit(): Promise<void> {
    this.getEmpresas();
  }


   
  //ACCIONES Y CALCULOS

  async getEmpresas(): Promise<void>{
     await this.empresaService.getListEmpresas().subscribe(
      (resp:any) => {
        this.listEmpresas = resp;  
       })
       ;
  }

  async eliminarAccion(empresa: Empresa) {
    this.empresaService.deleteEmpresa(empresa);
    await this.empresaService.getListEmpresas().subscribe(
      (resp:any) => {
        this.listEmpresas = resp;  
      }
    ), (error: any) => {
      console.log(error);
    };
    //Si eliminamos una empresa volvemos a calcular el total invertido
   // this.calcularTotalInvertido();
  }


  editarAccion() {}


/*
  async calcularTotalInvertido(){
    var empresas = await this.empresaService.getListEmpresas(); 
    var total = 0;
  
    empresas.forEach(element => {
        total = total + element.capitalInvertido; 
    });
    return this.totalAcciones = total; 
  }*/
  
  
  
  //FORMULARIOS

  mostrarFormulario() {
     this.mostrarFormularioEdicion = true;
  }
  

  cerrarFormulario() {
    this.mostrarFormularioEdicion = false;
  }


  mostrarFormulario2() {
    this.mostrarFormularioEdicion2 = true; 
  }

  cerrarFormulario2() {
    this.mostrarFormularioEdicion2 = false;
  }


  //Recepción de datos del hijo forumulario de edición
  recibirValor(siAgregada: boolean) {
    if (siAgregada) {
      this.getEmpresas(); 
    }
  }



  //CONSULTAS
  
  getInfoEmpresa(ticker:string){
    this.router.navigate(['/buscar',ticker]);
  }


  

 








}
