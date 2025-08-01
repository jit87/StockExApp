// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { EmpresaService } from '../services/empresa.service';
import { AbstractAuthService } from '../abstracts/AbstractAuthService';
import { AbstractEmpresaService } from '../abstracts/AbstractEmpresaService';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AbstractAuthService, private empresaService: AbstractEmpresaService) { }

  //Hay que vigilar siempre que no se añadan encabezados a peticiones que no nos interesan que las lleven
  //Aquí sólo queremos que el iterceptor manipule las peticiones al backend
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const isApiUrl = req.url.startsWith(this.authService.getAuthUrl());
    const isEmpresaUrl = req.url.startsWith(this.empresaService.getEmpresaUrl());

    if (token && (isApiUrl || isEmpresaUrl)) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }

}
