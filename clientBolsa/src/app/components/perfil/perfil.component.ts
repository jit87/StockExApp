import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Empresa } from '../../interfaces/Empresa';
import { EmpresaService } from '../../services/empresa.service';


@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {

  public listEmpresas: Empresa[] = [];
   
  constructor(public auth: AuthService, public empresaService: EmpresaService) { }
  

  ngOnInit() {
    this.getEmpresas();
  }
  

  getEmpresas() {
     this.listEmpresas = this.empresaService.getListEmpresas();
  }



  
}
