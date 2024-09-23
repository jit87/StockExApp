import { Component } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EditarAccionesComponent } from "./components/editar-acciones/editar-acciones.component";
import { ContenidoComponent } from "./components/contenido/contenido.component";
import { BuscadorEmpresaComponent } from "./components/buscador-empresa/buscador-empresa.component";
import { PerfilComponent } from "./components/perfil/perfil.component";
import { RegistroComponent } from "./authcomponents/registro/registro.component";
import { LoginComponent } from "./authcomponents/login/login.component";
import { AuthGuard } from "./guards/auth.guard";
import { GraficaSectoresComponent } from "./alonecomponents/grafica-sectores/grafica-sectores.component";
import { DividendosComponent } from "./components/dividendos/dividendos.component";


const APP_ROUTES: Routes = [
    { path:'contenido', component: ContenidoComponent, canActivate: [AuthGuard] },
    { path:'editar-acciones', component: EditarAccionesComponent, canActivate: [AuthGuard] },
    { path:'buscar/:ticker', component: BuscadorEmpresaComponent , canActivate: [AuthGuard] },
    { path:'perfil', component: PerfilComponent, canActivate: [AuthGuard] },
    { path:'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'dividendos', component:DividendosComponent, canActivate: [AuthGuard] },
    { path:'**', pathMatch: 'full', redirectTo: 'contenido' }
];

export const APP_ROUTING = RouterModule.forRoot(APP_ROUTES);