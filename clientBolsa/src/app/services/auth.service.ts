// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

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
    return this.http.post<any>(`${this.authUrl}/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        this.userSubject.next(response.user);
      })
    );
  }


  register(nombre: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/register`, {
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




}
