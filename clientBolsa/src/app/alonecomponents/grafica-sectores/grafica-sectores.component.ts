import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';

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

  //CONFIGURACIÓN DEL GRÁFICO
  view: [number, number] = [500, 400];
  doughnut: boolean = true;
  colorScheme = 'cool'; 
  legenda: boolean = true;
  showLabels: boolean = true;
  
  


  constructor(
    public _empresaService: EmpresaService, 
    public _authService: AuthService
  ) { }


  ngOnInit() {
    this.getUsuario(); 
    this.loadData();
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




}
