import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';

@Injectable()
export class StockService {


  //Claves
  private readonly alphaVantageApiKey = '22CEAEX0ALRYWVGC';
  private readonly polygonApiKey = 'hBGe43bus6XD4lEyv3tsmw46d4p7Y8u4';
  private readonly tiingoToken = '0338741793be8c2ea6c88b200364aa193ba45adf'; 
  private readonly fmpApiKey = 'DWYjYIL0ZShj4QzL5hQyAqwOfztp8X8w'; 
                                    


  constructor(private http: HttpClient) { }
  


  //Método general para manejar errores
  private handleError<T>(error: HttpErrorResponse, message: string, fallbackValue: T): Observable<T> {
    console.error(message, error);
    if (error.status === 429) {
      console.error('Error 429: Límite de velocidad alcanzado. Reduce la frecuencia de las solicitudes.');
    }
    return of(fallbackValue);
  }



  //Método genérico para obtener datos de Polygon.io
  private getFromPolygon<T>(url: string, errorMessage: string, fallbackValue: T): Observable<T> {
    return this.http.get<T>(url).pipe(
      catchError(error => this.handleError(error, errorMessage, fallbackValue))
    );
  }



  //Obtener precio de acción
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



  //Obtener industria de la acción
  getIndustry(ticker: string): Observable<string> {
    if (!ticker) return of('');

    const polygonUrl = `https://api.polygon.io/v1/meta/symbols/${ticker}/company?apiKey=${this.polygonApiKey}`;
    return this.getFromPolygon<any>(polygonUrl, 'Error al obtener la industria desde Polygon.io', {}).pipe(
      map(response => response?.industry || '')
    );
  }



  //Obtener nombre de la acción
  getName(nombre: string): Observable<string> {
    if (nombre.length < 3) return of('');

    const polygonUrl = `https://api.polygon.io/v3/reference/tickers?search=${nombre}&active=true&apiKey=${this.polygonApiKey}`;
    return this.getFromPolygon<any>(polygonUrl, 'Error al obtener el nombre desde Polygon.io', {}).pipe(
      map(response => response?.results?.[0]?.name || '')
    );
  }




  //Obtener datos de la acción
  getData(ticker: string): Observable<any> {
    const polygonUrl = `https://api.polygon.io/v1/meta/symbols/${ticker}/company?apiKey=${this.polygonApiKey}`;
    return this.getFromPolygon<any>(polygonUrl, 'Error al obtener los datos desde Polygon.io', {});
  }




//Obtener noticias para un ticker
getNews(ticker: string): Observable<any> {
  const limit = 3;
  const polygonUrl = `https://api.polygon.io/v2/reference/news?ticker=${ticker}&limit=${limit}&apiKey=${this.polygonApiKey}`;
  return this.getFromPolygon<any>(polygonUrl, 'Error al obtener noticias desde Polygon.io', {});
}

  
//https://api.polygon.io/v2/reference/news?limit=10&apiKey=RyUZfnDxPi7qX9OqVAoTFiwIKwzkr8U0
  
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

    const polygonUrl = `https://api.polygon.io/v3/reference/dividends?ticker=${ticker}&pay_date.lte=${lastDayOfYear}&pay_date.gte=${formattedCurrentDate}&limit=2&order=desc&sort=pay_date&apiKey=${this.polygonApiKey}`;

    return this.http.get<any>(polygonUrl).pipe(
      catchError(error => {
          console.error(`Error al obtener dividendos de ${ticker} en Polygon.io`, error);
          return of({ results: [] }); 
    })
  );
}
  

//Función para obtener los dividendos de varios tickers secuencialmente
getDividendsForTickers(tickers: string[]): Observable<any[]> {
  return from(tickers).pipe(
    concatMap(ticker => this.getDividends(ticker)), 
    toArray()
  );
}
  
  
  
  
  

}
