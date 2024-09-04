import { Injectable } from '@angular/core';
	import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
	import { Observable } from 'rxjs';
	import { AuthService } from '@auth0/auth0-angular';
	import { Router } from '@angular/router';

	@Injectable({
	  providedIn: 'root'
	})
	export class AuthGuard {

	  constructor(private auth: AuthService, private router: Router) {}

	  canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot): Observable<boolean>{
		return this.auth.isAuthenticated$;
	  }
	}
