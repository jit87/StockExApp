import { Component } from '@angular/core';
import { Empresa } from '../../interfaces/Empresa';
import { EmpresaService } from '../../services/empresa.service';


@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {

  public listEmpresas: Empresa[] = [];
   
  constructor( public empresaService: EmpresaService) { }
  

  ngOnInit() {
    this.getEmpresas();
  }
  

  async getEmpresas() {
     await this.empresaService.getListEmpresas().subscribe(
      (resp:any) => {
        this.listEmpresas = resp;  
      }
    );
  }



  
}
