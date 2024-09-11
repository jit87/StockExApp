import { Component } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EditarAccionesComponent } from "./components/editar-acciones/editar-acciones.component";
import { ContenidoComponent } from "./components/contenido/contenido.component";
import { BuscadorEmpresaComponent } from "./components/buscador-empresa/buscador-empresa.component";
import { PerfilComponent } from "./components/perfil/perfil.component";
import { AuthGuard } from "@auth0/auth0-angular";
import { ModificarAccionComponent } from './components/modificar-accion/modificar-accion.component';


const APP_ROUTES: Routes = [
    { path:'contenido', component: ContenidoComponent, canActivate: [AuthGuard] },
    { path:'editar-acciones', component: EditarAccionesComponent, canActivate: [AuthGuard] },
    { path:'buscar/:ticker', component: BuscadorEmpresaComponent, canActivate: [AuthGuard] },
    { path:'perfil', component: PerfilComponent, canActivate: [AuthGuard] },
    { path:'login', loadChildren: () => import('./authcomponents/authcomponents.module').then(m => m.AuthcomponentsModule) },
    { path:'register', loadChildren: () => import('./authcomponents/authcomponents.module').then(m => m.AuthcomponentsModule) },
    { path:'**', pathMatch: 'full', redirectTo: 'contenido' }
];

export const APP_ROUTING = RouterModule.forRoot(APP_ROUTES);