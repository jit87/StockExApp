import { NgModule, PipeTransform } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
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
import { NoticiasComponent } from './noticias/noticias.component';
import { TransforNumberPipe } from '../pipes/transfor-number.pipe';
import { GraficaSupersectoresComponent } from '../alonecomponents/grafica-supersectores/grafica-supersectores.component';
import { AnalisisComponent } from './analisis/analisis.component';


@NgModule({
  declarations: [
    ContenidoComponent,
    EditarAccionesComponent,
    BuscadorEmpresaComponent,
    NavbarComponent,
    PerfilComponent,
    FooterComponent,
    ModificarAccionComponent,
    DividendosComponent,
    NoticiasComponent,
    AnalisisComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    APP_ROUTING,
    GraficaSectoresComponent,
    NgxChartsModule,
    TransforNumberPipe,
    GraficaSupersectoresComponent
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
    DividendosComponent,
    NoticiasComponent,
    AnalisisComponent
  ],
  providers: [
    AuthService
  ]
})
export class ComponentsModule { }
