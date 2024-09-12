// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl = 'http://localhost:4000'; 
  private tokenKey = 'auth-token';
  
  private userSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  user$: Observable<any> = this.userSubject.asObservable();


  constructor(private http: HttpClient, private router: Router) { }



 login(email: string, password: string): Observable<any> {
  console.log('Attempting login...');
  return this.http.post<any>(`${this.authUrl}/login`, { email, password }).pipe(
    tap(response => {
      console.log('Login successful, storing token and navigating...');
      localStorage.setItem(this.tokenKey, response.token);
      this.userSubject.next(response.user);
      this.router.navigate(['/contenido']).then(() => {
        console.log('Navigation to /contenido successful');
      }).catch(err => {
        console.error('Navigation error:', err);
      });
    }),
    catchError(error => {
      console.error('Error during login', error);
      return throwError(error); 
    })
  );
}



  registro(nombre: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/registro`, {
      nombre,
      email,
      password
    });
  }



  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(null);
    //Volvemos a login si salimos
    this.router.navigate(['/login']);
  }



  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }



  isAuthenticated(): boolean {
    return !!this.getToken();
  }



  getUserById(id: string): Observable<any> {
    return this.http.get<any>(`${this.authUrl}/${id}`);
  }




}
