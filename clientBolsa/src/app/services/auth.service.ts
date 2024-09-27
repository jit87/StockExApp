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
  public authUrl = 'http://localhost:4000'; 
  private tokenKey = 'auth-token';
  
  private userSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  user$: Observable<any> = this.userSubject.asObservable();
  public usuarioData: any = []; 

  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());

  constructor(private http: HttpClient, private router: Router) { }


 login(email: string, password: string): Observable<any> {
   console.log('Iniciando login...');
   return this.http.post<any>(`${this.authUrl}/login`, { email, password }).pipe(
    tap(response => {
      console.log('Login existoso, guardando token y navegando...');

      //Guardamos el token y el email en el localStorage
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem('email', email);
      this.userSubject.next(response.user);

      //Accedemos al contenido principal
      this.router.navigate(['/contenido']).then(() => {
        console.log('Navegación a /contenido exitosa');
      }).catch(err => {
        console.error('Navegacion error:', err);
      });
    }),
     
    catchError(error => {
      console.error('Error durante login', error);
      return throwError(error); 
    })
   );
   
}

registro(nombre: string, email: string, password: string): Observable<any> {
  return this.http.post<any>(`${this.authUrl}/registro`, {
    nombre,
    email,
    password
  }).pipe(
    tap(response => {
      console.log('Registro exitoso:', response); 
    }),
    catchError(error => {
      console.error('Error durante el registro:', error);
      return throwError(error); 
    })
  );
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


  getUserByEmail(email: string | null):Observable<any> {
    return this.http.get<any>(`${this.authUrl}/usuario/${email}`);
  }



  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth-token');
  }


  authStatusListener() {
    return this.authStatus.asObservable();
  }


  modificarPassword(email: string, actualPassword: string, nuevaPassword: string): Observable<any> {
    return this.http.put<any>(`${this.authUrl}/modificar`, {
      email,
      actualPassword,
      nuevaPassword
    }).pipe(
      tap(response => {
        console.log('Contraseña modificada:', response); 
      }),
      catchError(error => {
        console.error('Error:', error);
        return throwError(error); 
      })
    );
}







}
