import { Component } from '@angular/core';
import { Empresa } from '../../interfaces/Empresa';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
//import '@fortawesome/fontawesome-free/css/all.min.css';
import $ from 'jquery'


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
  password: string = "";
  show: boolean = false;

  //Propiedades del nombre
  nuevoNombre: string = "";
  nombre: string = "";

  //Propiedades del email
  nuevoEmail: string = "";


  //Prodiedades de formularios
  mostrarFormulario: boolean = false;
  mostrarFormularioNom: boolean = false;
  mostrarFormularioEma: boolean = false;

  //Spinner
  loading: boolean = false;


  constructor(public empresaService: EmpresaService,
    private _authService: AuthService,
    private toastr: ToastrService) { }



  ngOnInit() {
    this.getEmpresas();
    this.getUsuario();
  }


  async getEmpresas() {
    await this.empresaService.getListEmpresas(this.usuario._id).subscribe(
      (resp: any) => {
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


  //FORMULARIOS

  /*Password*/
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
        this.toastr.error('La contraseña actual no coincide', 'Error');
      }
    )
  }


  cerrarFormularioPass() {
    this.mostrarFormulario = false;
  }


  abrirFormularioPass() {
    this.mostrarFormulario = true;
  }

  visualizarPasswordActual() {
    $('#actualPassword').attr('type', function (index, attr) {
      return attr == 'text' ? 'password' : 'text';
    })
  }

  visualizarPasswordNueva() {
    $('#nuevaPassword').attr('type', function (index, attr) {
      return attr == 'text' ? 'password' : 'text';
    })
  }


  /*Nombre*/
  cambiarNombre() {
    this.loading = false;
    this._authService.modificarNombre(this.email, this.nuevoNombre).subscribe(
      (resp: any) => {
        if (resp) {
          console.log("Nombre modificado", resp);
          this.toastr.success('El nombre ha sido modificado', 'Nombre modificado');
        }
        //Recuperamos el usuario para actualizar los datos en la impresión 
        this.getUsuario();
      },
      (err) => {
        console.log(err);
        this.toastr.error('El usuario no existe', 'Error');
      }
    )
  }

  abrirFormularioNom() {
    this.mostrarFormularioNom = true;
  }

  cerrarFormularioNom() {
    this.mostrarFormularioNom = false;
  }


  /*Email*/
  cambiarEmail() {
    this.loading = false;
    this._authService.modificarEmail(this.email, this.nuevoEmail).subscribe(
      (resp: any) => {
        if (resp) {
          console.log("Email modificado", resp);
          this.toastr.success('El email ha sido modificado', 'Email modificado');
        }
        //Recuperamos el usuario para actualizar los datos en la impresión 
        this.getUsuario();
      },
      (err) => {
        console.log(err);
        this.toastr.error('El usuario no existe', 'Error');
      }
    )
  }

  abrirFormularioEma() {
    this.mostrarFormularioEma = true;
  }

  cerrarFormularioEma() {
    this.mostrarFormularioEma = false;
  }


}
