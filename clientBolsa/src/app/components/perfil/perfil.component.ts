import { Component } from '@angular/core';
import { Empresa } from '../../interfaces/Empresa';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {

  public listEmpresas: Empresa[] = [];
  usuario: any = []; 

   
  constructor( public empresaService: EmpresaService, private _authService: AuthService) { }
  

  ngOnInit() {
    this.getEmpresas();
    this.getUsuario(); 
  }
  

  async getEmpresas() {
     await this.empresaService.getListEmpresas(this.usuario._id).subscribe(
      (resp:any) => {
        this.listEmpresas = resp;  
      }
    );
  }

  getUsuario() {
    var email = localStorage.getItem('email'); 
    console.log(email); 
    this._authService.getUserByEmail(email).subscribe(
      (resp: any) => {
        this.usuario = resp; 
      }
    )
  }



  
}
