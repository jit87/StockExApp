import { StockService } from "../services/stock.service";
import { Observable } from 'rxjs';


export interface Empresa{
    usuarioId?: string; 
    _id?: string;
    nombre: string;
    ticker: string;
    precio: number | Observable<number>;
    cantidad: number;
    //per: number; 
    capitalInvertido: number; 
    industria: string; 
    // yield: number;
    // dividendos: number; 
    valoracion?: number; 
    variacion?: number; 
}



