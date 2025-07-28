import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { EmpresaService } from '../../services/empresa.service';
import { Router } from '@angular/router';
import { StockData } from '../../abstracts/stock-data';

@Component({
  selector: 'app-dividendos',
  templateUrl: './dividendos.component.html',
  styleUrls: ['./dividendos.component.css']
})
export class DividendosComponent implements OnInit {

  //Variable para controlar si mostramos el contenido en función de la autenticación
  autenticado: boolean = false;
  //Lista de empresas de la BBDD
  listEmpresas: any[] = [];
  dividendos: any[] = [];
  disponible: boolean = false;
  cantidadesCobroImprimir: { cantidad: number, ticker: string }[] = [];
  totalCobrar: number = 0;

  constructor(
    private authService: AuthService,
    private empresaService: EmpresaService,
    private router: Router,
    private stockService: StockData
  ) { }

  ngOnInit(): void {
    this.getDividendosPorEmpresas();
  }

  //ACCIONES Y CALCULOS

  async getDividendosPorEmpresas(): Promise<void> {
    if (this.authService.isAuthenticated()) {
      this.autenticado = true;
      const usuarioId: any = localStorage.getItem('id');

      this.empresaService.getListEmpresas(usuarioId).subscribe(
        async (empresas: any) => {
          this.listEmpresas = empresas;
          const cantidades = this.getCantidadAcciones(empresas);

          //Verifica si hay dividendos almacenados en localStorage
          /*Queremos evitar sobrepasar el limite de llamadas a la API*/
          const dividendosAlmacenados = localStorage.getItem('dividendos');

          if (dividendosAlmacenados && dividendosAlmacenados !== '[]') {
            this.dividendos = JSON.parse(dividendosAlmacenados);
            console.log('Dividendos obtenidos de localStorage:', this.dividendos);

            //Calcula la cantidad a cobrar por cada acción
            this.calcularDividendosCobrar(cantidades);

          } else {
            //Obtiene dividendos de la API
            await this.getDividendosDeAPI(cantidades);
          }

          this.disponible = this.dividendos.length > 0;
        },
        (error: any) => {
          console.log(error);
          this.router.navigate(['/login']);
        }
      );
    }
  }

  //Obtiene los dividendos para cada empresa de la API y guardarlos en localStorage
  async getDividendosDeAPI(cantidades: any): Promise<void> {
    const dividendosPromises = this.listEmpresas.map(empresa => this.getDividendosPorTicker(empresa.ticker));
    const todosLosDividendos = await Promise.all(dividendosPromises);

    //Ordenamos por fecha de pago
    this.dividendos = todosLosDividendos.flat().sort((a, b) => {
      return new Date(a.pay_date).getTime() - new Date(b.pay_date).getTime();
    });

    this.calcularDividendosCobrar(cantidades);

    localStorage.setItem('dividendos', JSON.stringify(this.dividendos));
    console.log('Dividendos obtenidos de la API y guardados en localStorage:', this.dividendos);



  }



  //Obtiene los dividendos por ticker de la API
  getDividendosPorTicker(ticker: string): Promise<any> {
    return new Promise((resolve) => {
      this.stockService.getDividends(ticker).subscribe(
        (response: any) => {
          resolve(Array.isArray(response.results) ? response.results : []);
        },
        (error) => {
          console.log(`Error obteniendo dividendos para el ticker ${ticker}`, error);
          resolve([]);
        }
      );
    });
  }


  //Obtiene los la cantidad de acciones de cada empresa
  getCantidadAcciones(empresas: any[]): { cantidad: number, ticker: string }[] {
    return empresas.map(empresa => ({
      cantidad: empresa.cantidad,
      ticker: empresa.ticker
    }));
  }



  calcularDividendosCobrar(cantidades: any) {
    this.dividendos.forEach(dividendo => {
      const cantidad = cantidades.find((c: { ticker: any; }) => c.ticker === dividendo.ticker);
      if (cantidad) {
        this.cantidadesCobroImprimir.push({
          cantidad: dividendo.cash_amount * cantidad.cantidad,
          ticker: cantidad.ticker,
        });
        this.totalCobrar += dividendo.cash_amount * cantidad.cantidad;
      }
    });
  }






}
