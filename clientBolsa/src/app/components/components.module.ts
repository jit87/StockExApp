import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContenidoComponent } from './contenido/contenido.component';
import { EditarAccionesComponent } from './editar-acciones/editar-acciones.component';
import { BuscadorEmpresaComponent } from './buscador-empresa/buscador-empresa.component';
import { NavbarComponent } from './navbar/navbar.component';
import { PerfilComponent } from './perfil/perfil.component';
import { FooterComponent } from './footer/footer.component';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APP_ROUTING } from '../app.routes';
import { ModificarAccionComponent } from './modificar-accion/modificar-accion.component';
import { AuthService } from '../services/auth.service';
import { GraficaSectoresComponent } from "../alonecomponents/grafica-sectores/grafica-sectores.component";
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DividendosComponent } from './dividendos/dividendos.component';


@NgModule({
  declarations: [
    ContenidoComponent,
    EditarAccionesComponent,
    BuscadorEmpresaComponent,
    NavbarComponent,
    PerfilComponent,
    FooterComponent,
    ModificarAccionComponent,
    DividendosComponent
    
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    APP_ROUTING,
    GraficaSectoresComponent,
    NgxChartsModule
],
  exports: [
    ContenidoComponent,
    EditarAccionesComponent,
    BuscadorEmpresaComponent,
    NavbarComponent,
    PerfilComponent,
    FooterComponent,
    ModificarAccionComponent,
    GraficaSectoresComponent,
    DividendosComponent
  ],
  providers: [
     AuthService
  ]
})
export class ComponentsModule { }
