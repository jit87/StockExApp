import { StockService } from "../services/stock.service";
import { Observable } from 'rxjs';


export interface Empresa{
    nombre: string;
    ticker: string;
    precio: number | Observable<number>;
    acciones: number;
    //per: number; 
    invertido: number; 
    industria: string; 
    // yield: number;
    // dividendos: number; 

}



