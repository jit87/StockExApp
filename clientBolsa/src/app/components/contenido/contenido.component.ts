import { Component, OnInit} from '@angular/core';
import { StockService } from '../../services/stock.service';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../interfaces/Empresa';
import { Router } from '@angular/router';


@Component({
  selector: 'app-contenido',
  templateUrl: './contenido.component.html',
})

export class ContenidoComponent implements OnInit  {
  symbol = ''; 
  stockQuote: any;
  StockPrice: number | undefined;
  total: number | undefined; 
  listEmpresas: Empresa[] = []
  totalAcciones: number | undefined;
  Empresa: Empresa | undefined; 
  
  constructor(
    private stockService: StockService,
    public empresaService: EmpresaService,
    private router: Router
  ) {
   
  }

  chart: any;
  sectorData: { label: string; value: number }[] = [];

  // Variable para controlar la visibilidad del formulario de edición
  mostrarFormularioEdicion: boolean = false;

  

  ngOnInit(): void {
    this.listEmpresas = this.empresaService.getListEmpresas();
    // Verifica si el Ticker está presente antes de obtener el precio
    if (this.symbol) {
      // Obtiene y asigna el precio a StockPrice
      this.stockService.getPrice(this.symbol).subscribe((data: any) => {
        this.StockPrice = data.price;
      });
    }
    this.calcularTotalInvertido();
  }


   
  //ACCIONES Y CALCULOS

  eliminarAccion(empresa: Empresa) {
    this.empresaService.deleteEmpresa(empresa);
    this.listEmpresas = this.empresaService.getListEmpresas();
    //Si eliminamos una empresa volvemos a calcular el total invertido
    this.calcularTotalInvertido();
  }



  calcularTotalInvertido(){
    var empresas = this.empresaService.getListEmpresas(); 
    var total = 0;
  
    empresas.forEach(element => {
        total = total + element.invertido; 
    });
  
    return this.totalAcciones = total; 
  }

  
  
  mostrarFormulario() {
     this.mostrarFormularioEdicion = true;
  }
  


  cerrarFormulario() {
    this.mostrarFormularioEdicion = false;
  }



  //CONSULTAS
  
  getInfoEmpresa(ticker:string){
  
    this.router.navigate(['/buscar',ticker]);

  }


  

 








}
