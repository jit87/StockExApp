import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { LegendPosition, NgxChartsModule } from '@swimlane/ngx-charts';
import { EmpresaService } from '../../services/empresa.service';
import $ from 'jquery';
import { TransforNumberPipe } from "../../pipes/transfor-number.pipe";
import { AbstractAuthService } from '../../abstracts/AbstractAuthService';
import { AbstractEmpresaService } from '../../abstracts/AbstractEmpresaService';


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
  legendPosition: LegendPosition = LegendPosition.Right;


  constructor(
    public _empresaService: AbstractEmpresaService,
    public _authService: AbstractAuthService
  ) {

    $(".legend-title-text").html("Leyenda");

  }


  ngOnInit() {
    this.getUsuario();
    //.bind salta el objeto window y se refiere alobjeto apuntado por setLengendVisibility(), es decir this.leyenda
    this.setLegendVisibility();
    window.addEventListener('resize', this.setLegendVisibility.bind(this));
  }


  //Se oculta la leyenda para pantallas pequeñas
  setLegendVisibility(): void {
    this.leyenda = window.innerWidth > 991;
  }



  generarGrafico() {
    const sectorData: { [key: string]: number } = {};
    let totalCapitalInvertido = 0;
    let countSectores = 0;

    //Procesa datos para el gráfico
    this.listEmpresas.forEach((empresa: any) => {
      const sector = empresa.industria;
      const capitalInvertido = empresa.valoracion;

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
  }


  getPorcentajes() {
    this._empresaService.getListEmpresas(this.usuario).subscribe(
      (resp: any) => {
        this.listEmpresas = resp;
        //Cálculo del total necesario para el porcentaje
        this.listEmpresas.forEach((empresa) => {
          this.totalValoracion += empresa.valoracion;
        })
        this.listEmpresas.map(
          (empresa: any) => {
            var porcentaje = (empresa.valoracion / this.totalValoracion) * 100;
            this.porcentajes.push(porcentaje.toFixed(2));
            if (porcentaje > 5) {
              this.diversificadaPorcentaje = false;
            }
          }
        )
      },
      (error: any) => {
        console.log(error);
      }
    )
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
