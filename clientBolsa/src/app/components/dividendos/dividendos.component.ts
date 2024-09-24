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


constructor(
  private _authService: AuthService,
  private _empresaService: EmpresaService,
  private _router: Router,
  private _stockService: StockService) {
  
  }
  


ngOnInit() {
  this.getEmpresas();
}


  


//ACCIONES Y CALCULOS

async getEmpresas(): Promise<void> {
    if (this._authService.isAuthenticated()) {
        this.autenticado = true;
        const usuarioId: any = localStorage.getItem('id');

        this._empresaService.getListEmpresas(usuarioId).subscribe(
            async (resp: any) => {
                this.listEmpresas = resp;
                
                //Obtiene los dividendos almacenados
                var dividendosAlmacenados = localStorage.getItem('dividendos');
                
                //Si hay dividendos almacenados en localStorage y no están vacíos
                if (dividendosAlmacenados && dividendosAlmacenados !== '[]') {
                    this.dividendos = JSON.parse(dividendosAlmacenados); 
                    console.log('Dividendos obtenidos de localStorage:', this.dividendos);
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


  


}
