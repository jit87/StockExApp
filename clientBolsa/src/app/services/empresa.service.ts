// empresa.service.ts
import { Injectable } from '@angular/core';
import { Empresa } from '../interfaces/Empresa';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class EmpresaService {


  private listEmpresas: Empresa[] = [];

  url: string = "http://localhost:4000/empresas"; 
  


  //Actualizamos el valor de listEmpresas al cargar.
  constructor(private http: HttpClient) {
    const storedData = localStorage.getItem('Acciones');
    if (storedData) {
      this.listEmpresas = JSON.parse(storedData);
    }
  }

  //Obtenemos las empresas guardades en mongoDB
  getListEmpresas(): Observable<any> {
    return this.http.get(this.url);
  }


  //Añadimos la empresa al vector de empresas y luego a la BBDD de mongoDB. 
  addEmpresa(empresa: Empresa): Observable<any> {
     this.listEmpresas.push(empresa);
     return this.http.post(this.url, empresa); 
  }


  //Quitamos la empresa del vector de empresas y luego actualizamos el LocalStorage.
  deleteEmpresa(empresaId: Empresa): Observable<any> {
    console.log(empresaId); 
    //var index =  this.listEmpresas.indexOf(empresaId);
   // this.listEmpresas.splice(index, 1);
    return this.http.delete(this.url + "/" +  empresaId); 
   
  }


  

  editarAccion() {
    
  }





}
