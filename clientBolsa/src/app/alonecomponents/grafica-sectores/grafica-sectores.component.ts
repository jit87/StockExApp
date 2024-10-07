import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import $ from 'jquery';
import { TransforNumberPipe } from "../../pipes/transfor-number.pipe";


@Component({
  selector: 'app-grafica-sectores',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, TransforNumberPipe],
  templateUrl: './grafica-sectores.component.html',
  styleUrls: ['./grafica-sectores.component.css']
})
export class GraficaSectoresComponent implements OnInit {

  usuario: any; 
  listEmpresas: any[] = []; 
  data: any[] = []; 

  //Propiedades de análisis
  diversificada: boolean = false; 
  diversificadaPorcentaje: boolean = true; 
  diversificadaNsectores: boolean = false; 
  porcentajes: any[] = []; 
  numeroSectores: number | any; 
  totalValoracion: number = 0; 


  //CONFIGURACIÓN DEL GRÁFICO
  view: [number, number] = [500, 400];
  doughnut: boolean = true;
  colorScheme = 'cool'; 
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


 generarGrafico() {
   const sectorData: { [key: string]: number } = {};
   let totalCapitalInvertido = 0; 
   let countSectores = 0;  
    
   //Procesa datos para el gráfico
   this.listEmpresas.forEach((empresa: any) => {
     const sector = empresa.industria;
     const capitalInvertido = empresa.capitalInvertido;

     if (sectorData[sector]) {
       sectorData[sector] += capitalInvertido;
     } else {
       sectorData[sector] = capitalInvertido;
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
}


  //CONSULTAS

  getUsuario() {
    const email = localStorage.getItem('email'); 
    this._authService.getUserByEmail(email).subscribe(
      (resp: any) => {
        this.usuario = resp; 
        this.loadData(); 
      }
    );
  }

  loadData() {
    this._empresaService.getListEmpresas(this.usuario).subscribe(
      (resp: any) => {
        this.listEmpresas = resp;  
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
         console.log(this.porcentajes); 
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
   
 



}
