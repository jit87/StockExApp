import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import $ from 'jquery';
import { TransforNumberPipe } from "../../pipes/transfor-number.pipe";


@Component({
  selector: 'app-grafica-supersectores',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, TransforNumberPipe],
  templateUrl: './grafica-supersectores.component.html',
  styleUrls: ['./grafica-supersectores.component.css']
})
export class GraficaSupersectoresComponent implements OnInit {

  usuario: any; 
  listEmpresas: any[] = []; 
  listEmpresasGrafico: any[] = []; 
  data: any[] = []; 

  //Propiedades de análisis
  diversificada: boolean = false; 
  diversificadaPorcentaje: boolean = true; 
  diversificadaNsectores: boolean = false; 
  porcentajes: any[] = []; 
  numeroSectores: number | any; 
  totalValoracion: number = 0; 
  mayorSupersector: string = ''; 


  //CONFIGURACIÓN DEL GRÁFICO
  view: [number, number] = [500, 400];
  doughnut: boolean = true;
  colorScheme = 'vivid'; 
  leyenda: boolean = true;
  showLabels: boolean = true;


  constructor(
    public _empresaService: EmpresaService, 
    public _authService: AuthService
  ) { 

    $(".legend-title-text").html("Leyenda");

  }


  ngOnInit() {
    this.getUsuario(); 
  }



 //Similar al primer gráfico solo que utiliza los supersectores
  generarGrafico() {
   this.listEmpresasGrafico = [];
   const sectorData: { [key: string]: number } = {};
   let totalCapitalInvertido = 0; 
   let countSectores = 0;  
    
   //Procesa datos para el gráfico
   this.listEmpresas.forEach((empresa: any) => { 
     const sector = empresa.industria;
     const capitalInvertido = empresa.capitalInvertido;
     
     //Obtenemos el supersector al que pertenece (Cíclico, Sensible, Defensivo)
     var supersector = this.determinarSupersector(sector); 
    
     //Guardamos el supersector en una nueva propiedad para mostrarlo en vez del sector
     empresa.supersector = supersector; 

     this.listEmpresasGrafico.push(empresa);

     if (sectorData[supersector]) {
       sectorData[supersector] += capitalInvertido;
     } else {
       sectorData[supersector] = capitalInvertido;
       countSectores++; 
     }

     //Suma al total de capital invertido
     totalCapitalInvertido += capitalInvertido;
   });

   //Convierte el objeto sectorData a un array para el gráfico
   this.data = Object.entries(sectorData).map(([name, value]) => {
     const porcentaje = totalCapitalInvertido ? ((value / totalCapitalInvertido) * 100).toFixed(2) : 0;
     return {
       name: `${name} (${porcentaje}%)`, 
       value
     };
   });
   
   //Para comprobar el nº de sectores
   this.comprobarNsectores(countSectores); 

   //Para conocer cómo de sensible es la cartera al ciclo económico
   this.calcularSensibilidad(this.data); 
}


  //CONSULTAS

  getUsuario() {
    const email = localStorage.getItem('email'); 
    this._authService.getUserByEmail(email).subscribe(
      (resp: any) => {
        this.usuario = resp; 
        //Carga los datos 
        this.loadData(); 
      }
    );
  }


  loadData() {
    this._empresaService.getListEmpresas(this.usuario).subscribe(
      (resp: any) => {
        this.listEmpresas = resp;  
        //Una vez obtenidos los datos en función del usuario generamos el gráfico y los demas datos
        this.generarGrafico(); 
      }
    );
    this.getPorcentajes(); 
    this.getTotalValoracion(); 
  }


  getPorcentajes() {
    this.getTotalValoracion(); 
     this._empresaService.getListEmpresas(this.usuario).subscribe(
      (resp: any) => {
         this.listEmpresas = resp;  
         this.listEmpresas.map(
           (empresa: any) => {
             var porcentaje = (empresa.valoracion / this.totalValoracion) * 100;
             this.porcentajes.push(porcentaje.toFixed(2));
             if (porcentaje > 5) {
               this.diversificadaPorcentaje = false; 
             }
           }
         )
      }
    );
  }

  getTotalValoracion() {
    this._empresaService.getListEmpresas(this.usuario).subscribe(
      (resp: any) => {
         this.listEmpresas = resp;  
         this.listEmpresas.map(
           (empresa: any) => {
             this.totalValoracion += empresa.valoracion; 
           }
         )
        return this.totalValoracion; 
      }
    );
  }


  //OTRAS FUNCIONES
  
  comprobarDiversificacion() {
    if (this.listEmpresas.length < 10) {
      this.diversificada = false; 
    } else {
      this.diversificada = true; 
    }
  }


  //Para analizar la diversificación por nº de sectores
  comprobarNsectores(countSectores: number) {
      if (countSectores >= 8) {
      this.diversificadaNsectores = true; 
    } else {
      this.numeroSectores = countSectores;
    }
  }
   

  determinarSupersector(sector: any) {
     switch (sector.toLowerCase()) {
        //Cyclical Sectors
        case 'basic materials':
        case 'building materials':
        case 'chemicals':
        case 'construction':
        case 'metals & mining':
        case 'packaging':
        case 'autos':
        case 'auto parts':
        case 'apparel retail':
        case 'consumer electronics':
        case 'home improvement retail':
        case 'specialty retail':
        case 'hotels, resorts & cruise lines':
        case 'leisure products':
        case 'restaurants':
        case 'media':
        case 'banks':
        case 'capital markets':
        case 'insurance':
        case 'consumer finance':
        case 'reit':
        case 'real estate management & development':
          return 'Cíclico';

        //Sensitive Sectors
        case 'communication services':
        case 'media & entertainment':
        case 'interactive media & services':
        case 'oil, gas & consumable fuels':
        case 'renewable energy':
        case 'coal & consumable fuels':
        case 'energy equipment & services':
        case 'aerospace & defense':
        case 'industrial machinery':
        case 'electrical equipment':
        case 'construction & engineering':
        case 'farm & construction machinery':
        case 'professional services':
        case 'airlines':
        case 'marine':
        case 'road & rail':
        case 'technology hardware, storage & peripherals':
        case 'semiconductors & semiconductor equipment':
        case 'software':
        case 'it services':
        case 'application software':
        case 'communication equipment':
        case 'computer hardware':
        case 'online media':
        case 'semiconductors':
          return 'Sensible';

        //Defensive Sectors
        case 'pharmaceuticals':
        case 'biotechnology':
        case 'healthcare providers & services':
        case 'healthcare equipment & supplies':
        case 'electric utilities':
        case 'utilities - regulated':
        case 'gas utilities':
        case 'water utilities':
        case 'renewable electricity':
        case 'food products':
        case 'beverages':
        case 'household products':
        case 'personal products':
        case 'tobacco':
        case 'food & staples retailing':
          return 'Defensivo';

    default:
          return 'No Clasificado';
      }
  }
 

calcularSensibilidad(data: any[]) {
  let mayorSector: any[] = [];
  let maxValue = 0;  
  let todosIguales = true;

  for (let i = 0; i < data.length; i++) {
    if (i > 0 && data[i].value !== data[i - 1].value) {
      todosIguales = false;
    }

    if (data[i].value > maxValue) {
      maxValue = data[i].value;   
      mayorSector = [data[i]];   
    } else if (data[i].value === maxValue) {
      mayorSector.push(data[i]); 
    }
  }

  if (todosIguales) {
    this.mayorSupersector = "Equilibrada";
  } else {
    this.mayorSupersector = mayorSector[0].name.toLowerCase(); 
  }
}




}
