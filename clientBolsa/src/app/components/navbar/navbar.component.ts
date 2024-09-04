import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

  img1="https://icons.iconarchive.com/icons/custom-icon-design/flatastic-11/256/Cash-icon.png";

  constructor(public auth: AuthService, @Inject(DOCUMENT) private document: Document) { }
  

}
