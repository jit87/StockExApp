import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, concatMap, map, mergeMap, switchMap, toArray } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { environment } from '../environments/environment';
import { StockData } from '../abstracts/stock-data';


@Injectable()
export class StockService extends StockData {

  //Claves API
  private readonly alphaVantageApiKey = environment.alphaVantageApiKey;
  private readonly polygonApiKey = environment.polygonApiKey;
  private readonly marketstackApiKey = environment.marketstackApiKey;
  private readonly finnhubApiKey = environment.finnhubApiKey;
  private readonly tiingoToken = environment.tiingoToken;
  private readonly fmpApiKey = environment.fmpApiKey;


  constructor(private http: HttpClient) { super(); }


  private handleError<T>(error: HttpErrorResponse, message: string, fallbackValue: T): Observable<T> {
    console.error(message, error);
    if (error.status === 429) {
      console.error('Error 429: Límite de velocidad alcanzado. Reduce la frecuencia de las solicitudes.');
    }
    return of(fallbackValue);
  }


  private getFromPolygon<T>(url: string, errorMessage: string, fallbackValue: T): Observable<T> {
    return this.http.get<T>(url).pipe(
      catchError(error => this.handleError(error, errorMessage, fallbackValue))
    );
  }

  private getFromFinnhub<T>(url: string, errorMessage: string, fallbackValue: T): Observable<T> {
    return this.http.get<T>(url).pipe(
      catchError(error => this.handleError(error, errorMessage, fallbackValue))
    );
  }


  getPrice(ticker: string): Observable<number> {
    if (!ticker) return of(0);

    const alphaVantageUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=full&apikey=${this.alphaVantageApiKey}`;
    const polygonUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${this.polygonApiKey}`;

    return this.getFromPolygon<any>(alphaVantageUrl, 'Error al obtener el precio desde Alpha Vantage', {}).pipe(
      switchMap(response => {
        const price = response?.['Time Series (Daily)']?.['2024-02-17']?.['1. close'];
        return price ? of(price) : this.getFromPolygon<any>(polygonUrl, 'Error al obtener el precio desde Polygon.io', {}).pipe(
          map(polygonResponse => polygonResponse?.results?.[0]?.c || 0)
        );
      }),
      catchError(() => of(0))
    );
  }


  getIndustry(ticker: string): Observable<string> {
    if (!ticker) return of('');

    const polygonUrl = `https://api.polygon.io/v1/meta/symbols/${ticker}/company?apiKey=${this.polygonApiKey}`;
    return this.getFromPolygon<any>(polygonUrl, 'Error al obtener la industria desde Polygon.io', {}).pipe(
      map(response => response?.industry || '')
    );
  }


  getName(nombre: string): Observable<string> {
    if (nombre.length < 3) return of('');

    const polygonUrl = `https://api.polygon.io/v3/reference/tickers?search=${nombre}&active=true&apiKey=${this.polygonApiKey}`;
    const finnhubUrl = `https://finnhub.io/api/v1/search?q=${nombre}&count=4&token=${this.finnhubApiKey}`;

    return this.getFromPolygon<any>(polygonUrl, 'Error al obtener el nombre desde Polygon.io', {}).pipe(
      switchMap(response => {
        const name = response?.results?.[0]?.name || '';
        if (name) {
          return of(name);
        }
        //Si no encontramos un nombre en Polygon, realizamos la búsqueda en Finnhub
        return this.getFromFinnhub<any>(finnhubUrl, 'Error al obtener el nombre desde Finnhub', {}).pipe(
          map(finnhubResponse => {
            console.log('Respuesta de Finnhub:', finnhubResponse);
            return finnhubResponse?.result?.[0]?.description || '';
          })
        );
      })
    );
  }



  getData(ticker: string): Observable<any> {
    const polygonUrl = `https://api.polygon.io/v1/meta/symbols/${ticker}/company?apiKey=${this.polygonApiKey}`;
    return this.getFromPolygon<any>(polygonUrl, 'Error al obtener los datos desde Polygon.io', {});
  }


  getNews(ticker: string): Observable<any> {
    const limit = 3;
    const polygonUrl = `https://api.polygon.io/v2/reference/news?ticker=${ticker}&limit=${limit}&apiKey=${this.polygonApiKey}`;
    return this.getFromPolygon<any>(polygonUrl, 'Error al obtener noticias desde Polygon.io', {});
  }


  getGeneralNews(): Observable<any> {
    const limit = 10;
    const polygonUrl = `https://api.polygon.io/v2/reference/news?&limit=${limit}&apiKey=${this.polygonApiKey}`;
    return this.getFromPolygon<any>(polygonUrl, 'Error al obtener noticias desde Polygon.io', {});
  }


  getDividends(ticker: string): Observable<any> {
    const currentDate = new Date();
    const formattedCurrentDate = currentDate.toISOString().split('T')[0];
    const currentYear = currentDate.getFullYear();
    const lastDayOfYear = `${currentYear}-12-31`;
    const limit = 1;

    const polygonUrl = `https://api.polygon.io/v3/reference/dividends?ticker=${ticker}&pay_date.lte=${lastDayOfYear}&pay_date.gte=${formattedCurrentDate}&limit=${limit}&order=desc&sort=pay_date&apiKey=${this.polygonApiKey}`;
    const marketstackUrl = `https://api.marketstack.com/v1/dividends?access_key=${this.marketstackApiKey}&symbols=${ticker}&date_from=${formattedCurrentDate}&date_to=${lastDayOfYear}&limit=${limit}`;

    return this.http.get<any>(polygonUrl).pipe(
      catchError(error => {
        console.error(`Error al obtener dividendos de ${ticker} en Polygon.io`, error);
        return this.http.get<any>(marketstackUrl).pipe(
          catchError(error => {
            console.error(`Error al obtener dividendos de ${ticker} en Marketstack`, error);
            return of({ results: [] });
          })
        );
      })
    );
  }


  getDividendsForTickers(tickers: string[]): Observable<any[]> {
    return from(tickers).pipe(
      concatMap(ticker => this.getDividends(ticker)),
      toArray()
    );
  }



}
