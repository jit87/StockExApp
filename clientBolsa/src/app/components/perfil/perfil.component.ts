import { Component } from '@angular/core';
import { Empresa } from '../../interfaces/Empresa';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {

  public listEmpresas: Empresa[] = [];
  usuario: any = []; 
  email: string | any 


  //Propiedades de la contraseña
  actualPassword: string = "";
  nuevaPassword: string = ""; 

  //Prodiedades de formulario
  mostrarFormulario: boolean = false; 

  //Spinner
  loading: boolean = false; 
  toastr: any;

   
  constructor(public empresaService: EmpresaService,
              private _authService: AuthService,
              private http: HttpClient ) { }
            
  

  ngOnInit() {
    this.getEmpresas();
    this.getUsuario(); 
    console.log(); 
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
    this._authService.getUserByEmail(email).subscribe(
      (resp: any) => {
        this.usuario = resp; 
      }
    )
    //Guardamos el email para usarlo después
    this.email = email; 
  }


  //FORMULARIO

 cambiarPassword() {
    this.loading = false; 
    this._authService.modificarPassword(this.email, this.actualPassword, this.nuevaPassword).subscribe(
      (resp: any) => {
        if (resp) {
           console.log("Contraseña cambiada", resp); 
           this.toastr.success('La contraseña ha sido cambiada', 'Contraseña cambiada');
        }
      },
      (err) => {
        console.log(err); 
      }
    )
  }


  cerrarFormularioPass() {
    this.mostrarFormulario = false; 
  }
 

  abrirFormularioPass() {
    this.mostrarFormulario = true; 
  }


  
}
