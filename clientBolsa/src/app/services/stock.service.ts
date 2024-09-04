import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable()
export class StockService {

  //Claves
  private readonly alphaVantageApiKey = '22CEAEX0ALRYWVGC';
  private readonly polygonApiKey = 'RyUZfnDxPi7qX9OqVAoTFiwIKwzkr8U0'; 


  constructor(private http: HttpClient) {}


  //Getters

  getPrice(ticker: string): Observable<number> {
    if (!ticker) {
      console.warn('Error: El valor de "ticker" está vacío.');
      return of(0);
    }
    //Primero busca en Alpha Vantage, y si no hay datos en Polygon.io
    return this.http.get<any>(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=full&apikey=${this.alphaVantageApiKey}`)
      .pipe(
        switchMap(alphaVantageResponse => {
          const alphaVantagePrice = alphaVantageResponse?.['Time Series (Daily)']?.['2024-02-17']?.['1. close'];
          if (alphaVantagePrice) {
            return of(alphaVantagePrice);
          } else {
            // Solo realiza la solicitud a Polygon.io si el valor de ticker está presente
            return this.http.get<any>(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${this.polygonApiKey}`)
            .pipe(
              switchMap(polygonResponse => {
                const polygonPrice = polygonResponse?.results?.[0]?.c;
                  if (polygonPrice !== undefined) {
                    return of(polygonPrice);
                  } else {
                    console.error("Error: No se pudo obtener el precio de la acción desde Polygon.io");
                    return of(0);
                  }
              }),
              catchError(polygonError => {
                console.error("Error al obtener el precio de la acción desde Polygon.io", polygonError);
                return of(0);
              })
            );
          }
        }),
        catchError((alphaVantageError: HttpErrorResponse) => {
          console.error("Error al obtener el precio de la acción desde Alpha Vantage", alphaVantageError);
          return of(0);
        })
      );
  }



  getIndustry(ticker: string): Observable<string> {
    if (!ticker) {
        console.warn('Error: El valor de "ticker" está vacío.');
        return of('');
    }
    // Obteniene la información de la empresa desde Polygon.io
    return this.http.get<any>(`https://api.polygon.io/v1/meta/symbols/${ticker}/company?apiKey=${this.polygonApiKey}`)
      .pipe(
        switchMap(polygonResponse => {
          const industry = polygonResponse?.industry;
          if (industry !== undefined) {
            return of(industry);
          } else {
            console.error("Error: No se pudo obtener la industria de la acción desde Polygon.io");
            return of('');
          }
        }),
        catchError(error => {
          console.error("Error al obtener la industria de la acción desde Polygon.io", error);
          return of('');
        })
      );
  }


  getName(nombre: string): Observable<string> {
    if (nombre.length < 3) {
      console.log("La búsqueda requiere al menos tres letras.");
      return of('');
    }
    const polygonUrl = `https://api.polygon.io/v3/reference/tickers?search=${nombre}&active=true&apiKey=${this.polygonApiKey}`;

    return this.http.get<any>(polygonUrl).pipe(
      switchMap(polygonResponse => {
        const results = polygonResponse?.results;
  
        if (results && results.length > 0) {
          const polygonName = results[0].name;
          return of(polygonName);
        } else {
          console.error("Error: No se pudo obtener el nombre de la acción desde Polygon.io");
          return of(''); 
        }
      }),
      catchError(polygonError => {
        console.error("Error al obtener el nombre de la acción desde Polygon.io", polygonError);
  
        if (polygonError instanceof HttpErrorResponse) {
          if (polygonError.status === 429) {
            console.error("Error 429: Límite de velocidad alcanzado. Reduce la frecuencia de las solicitudes.");
          }
        }
  
        return of(''); 
      })
    );
  }


  
  getData(ticker: string): Observable<string> {
                 
    const polygonUrl = `https://api.polygon.io/v1/meta/symbols/${ticker}/company?apiKey=${this.polygonApiKey}`;
    
    return this.http.get<any>(polygonUrl).pipe(
      switchMap(polygonResponse => {
        if (polygonResponse) {
          return of(polygonResponse);
        } else {
          console.error("Error: No se pudo obtener los datos de la acción desde Polygon.io");
          return of(''); 
        }
      }),
      catchError(polygonError => {
        console.error("Error al obtener el nombre de la acción desde Polygon.io", polygonError);
    
        if (polygonError instanceof HttpErrorResponse) {
          if (polygonError.status === 429) {
            console.error("Error 429: Límite de velocidad alcanzado. Reduce la frecuencia de las solicitudes.");
          }
        }
    
        return of(''); 
      })
    );
  }





  getNews(ticker: string){

    const limit = 3; 
    const polygonUrl = `https://api.polygon.io/v2/reference/news?ticker=${ticker}&limit=${limit}&apiKey=${this.polygonApiKey}`;

    return this.http.get<any>(polygonUrl).pipe(
      switchMap(polygonResponse => {
        if (polygonResponse) {
          return of(polygonResponse);
        } else {
          console.error("Error: No se pudo obtener los datos de la acción desde Polygon.io");
          return of(''); 
        }
      }),
      catchError(polygonError => {
        console.error("Error al obtener el nombre de la acción desde Polygon.io", polygonError);
    
        if (polygonError instanceof HttpErrorResponse) {
          if (polygonError.status === 429) {
            console.error("Error 429: Límite de velocidad alcanzado. Reduce la frecuencia de las solicitudes.");
          }
        }
    
        return of(''); 
      })
    );



  }
  





  

}


  

