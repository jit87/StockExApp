import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { EmpresaService } from '../../services/empresa.service';
import { Router } from '@angular/router';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-dividendos',
  templateUrl: './dividendos.component.html',
  styleUrl: './dividendos.component.css'
})
export class DividendosComponent {


//Variable para controlar si mostramos el contenido en función de la autenticación
autenticado: boolean = false; 
//Empresas de la BBDD
listEmpresas: any[] = [];
dividendos: any[] = [];
disponible: boolean = true;  
cantidadesCobroImprimir: any[] = [{}];

    

constructor(
  private _authService: AuthService,
  private _empresaService: EmpresaService,
  private _router: Router,
  private _stockService: StockService) {
  
  }
  


ngOnInit() {
    this.getDividendosPorEmpresas();
}


  


//ACCIONES Y CALCULOS

async getDividendosPorEmpresas(): Promise<void> {
    if (this._authService.isAuthenticated()) {
        this.autenticado = true;
        const usuarioId: any = localStorage.getItem('id');

        this._empresaService.getListEmpresas(usuarioId).subscribe(
            async (resp: any) => {
                this.listEmpresas = resp;
                //Almacenamos las cantidades de acciones que tenemos de cada empresa
                var cantidades = this.getCantidad(resp); 
                console.log(cantidades); 
                
                //Obtiene los dividendos almacenados
                var dividendosAlmacenados = localStorage.getItem('dividendos');
                
                //Comprobamos si hay dividendos almacenados en localStorage y no están vacíos
                //Usamos localStorage para evitar las limitaciones de la API
                if (dividendosAlmacenados && dividendosAlmacenados !== '[]') {
                    this.dividendos = JSON.parse(dividendosAlmacenados); 
                    console.log('Dividendos obtenidos de localStorage:', this.dividendos);

                    //Calculamos la cantidad a cobrar por cada acción
                    this.dividendos.forEach((dividendo) => {

                        cantidades.forEach(cantidad => {
                            if ((dividendo.ticker === cantidad.ticker) && cantidad!=undefined && cantidad!=null) {

                                const cantidadImprimir = dividendo.cash_amount * cantidad.cantidad ;

                                this.cantidadesCobroImprimir.push({
                                    cantidad: cantidadImprimir,
                                    ticker: cantidad.ticker
                                });
                            }
                        });
                    });                                
                } else {
                    //Llama a getDividendos para cada empresa
                    const dividendosPromises = this.listEmpresas.map((empresa: any) => this.getDividendos(empresa.ticker));

                    //Espera a que todas las promesas se resuelvan
                    const allDividendos = await Promise.all(dividendosPromises);

                    //Acumula todos los dividendos y asegúrate de que sean fechas válidas
                    this.dividendos = allDividendos.flat().sort((a, b) => {
                        const dateA = new Date(a.pay_date);
                        const dateB = new Date(b.pay_date);

                        return dateA.getTime() - dateB.getTime();
                    });

                    //Guarda los dividendos en localStorage
                    localStorage.setItem('dividendos', JSON.stringify(this.dividendos));
                    console.log('Dividendos obtenidos de la API y guardados en localStorage:', this.dividendos);

                }

                this.disponible = this.dividendos.length > 0;
            },
            (error: any) => {
                console.log(error);
                this._router.navigate(['/login']);
            }
        );
    }
}


  

getDividendos(ticker: string): Promise<any> {
    return new Promise((resolve, reject) => {
        this._stockService.getDividends(ticker).subscribe(
            (resp: any) => {
                if (Array.isArray(resp.results)) {
                    resolve(resp.results);
                } else {
                    resolve([]);
                }
            },
            (err) => {
                console.log(`Ha fallado para el ticker ${ticker}`, err);
                resolve([]); 
            }
        );
    });
}

    
    
 getCantidad(empresas: any[]) {
    //Almacenamos pares de valores para cada empresa.
    let cantidadesCobro: {cantidad: number, ticker: string}[] = [];
    empresas.forEach((empresa) => {
        cantidadesCobro.push({
            cantidad: empresa.cantidad,
            ticker: empresa.ticker
        });
    });
     console.log(cantidadesCobro); 
     return cantidadesCobro; 
}
    

  


}
