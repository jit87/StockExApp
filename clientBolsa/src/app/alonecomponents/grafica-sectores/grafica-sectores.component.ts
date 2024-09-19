import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import $ from 'jquery'; 

@Component({
  selector: 'app-grafica-sectores',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './grafica-sectores.component.html',
  styleUrls: ['./grafica-sectores.component.css']
})
export class GraficaSectoresComponent implements OnInit {

  usuario: any; 
  listEmpresas: any[] = []; 
  data: any[] = []; 

  //Propiedades de análisis
  diversificada: boolean = false; 

  porcentajes: any[] = []; 
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

    //$(".chart-legend.legend-title.legend-title-text").html("Leyenda");

  }


  ngOnInit() {
    this.getUsuario(); 
    this.loadData();
    this.getPorcentajes(); 
   // this.getTotalValoracion(); 
  }


  generarGrafico() {
    const sectorData: { [key: string]: number } = {};
    //Procesar datos para el gráfico
    this.listEmpresas.forEach((empresa: any) => {
      const sector = empresa.industria;
      const capitalInvertido = empresa.capitalInvertido;
 
      if (sectorData[sector]) {
        sectorData[sector] += capitalInvertido;
      } else {
        sectorData[sector] = capitalInvertido;
      }
    });
    //Convertir el objeto sectorData a un array para el gráfico
    this.data = Object.entries(sectorData).map(([name, value]) => ({
      name,
      value
    }));
  }



  //CONSULTAS

  loadData() {
    this._empresaService.getListEmpresas(this.usuario).subscribe(
      (resp: any) => {
        this.listEmpresas = resp;  
        this.generarGrafico(); 
      }
    );
  }

  getUsuario() {
    const email = localStorage.getItem('email'); 
    this._authService.getUserByEmail(email).subscribe(
      (resp: any) => {
        this.usuario = resp; 
        this.loadData(); 
      }
    );
  }

  getPorcentajes() {
     this._empresaService.getListEmpresas(this.usuario).subscribe(
      (resp: any) => {
         this.listEmpresas = resp;  
         console.log(this.listEmpresas); 
         this.listEmpresas.map(
           (empresa: any) => {
            // var porcentaje =  / empresa.valoracion;
            // this.porcentajes.push();
           }
         )
      }
    );
  }

 /* getTotalValoracion() {
    this._empresaService.getListEmpresas(this.usuario).subscribe(
      (resp: any) => {
        this.totalValoracion += resp.valoracion; 
        console.log(this.totalValoracion); 
      },
      (err) => { 
        console.log("Error al obtener la valoración", err); 
     }
    )
  }*/


  //OTRAS FUNCIONES
  
  comprobarDiversificacion() {
    if (this.listEmpresas.length < 10) {
      this.diversificada = false; 
    } else {
      this.diversificada = true; 
    }
  }





}
