import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Injectable } from '@angular/core';
import { async } from 'rxjs';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

  img1 = "https://icons.iconarchive.com/icons/custom-icon-design/flatastic-11/256/Cash-icon.png";
  autenticado: boolean | any = false;
  isAuthenticated: boolean = false;


  constructor(private _authService: AuthService, private cdRef: ChangeDetectorRef) {
    if(this._authService.isAuthenticated()) {
      this.autenticado = true;
    }
  }


  ngDoCheck(): void {
    this.checkAuthentication();
  }

  checkAuthentication() {
    const token = localStorage.getItem('auth-token');
    this.isAuthenticated = !!token; 
  }

  
  logout() {
    this._authService.logout(); 
    this.autenticado = false; 
  }
  
  

}
