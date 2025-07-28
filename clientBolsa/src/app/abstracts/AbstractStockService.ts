import { Observable } from "rxjs";

export abstract class AbstractStockService {

    abstract getPrice(ticker: string): Observable<number>

    abstract getIndustry(ticker: string): Observable<string>

    abstract getName(nombre: string): Observable<string>

    abstract getData(ticker: string): Observable<any>

    abstract getNews(ticker: string): Observable<any>

    abstract getGeneralNews(): Observable<any>

    abstract getDividends(ticker: string): Observable<any>

    abstract getDividendsForTickers(tickers: string[]): Observable<any[]>

}