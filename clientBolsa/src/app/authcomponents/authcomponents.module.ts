import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './registro/registro.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthcomponentsRoutingModule } from './authcomponents-routing.module';



@NgModule({
  declarations: [
    LoginComponent,
    RegistroComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AuthcomponentsRoutingModule
  ],
  exports: [
    LoginComponent,
    RegistroComponent
  ]
})
export class AuthcomponentsModule { }
