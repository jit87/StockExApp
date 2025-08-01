// empresa.service.ts
import { Injectable } from '@angular/core';
import { Empresa } from '../interfaces/Empresa';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbstractEmpresaService } from '../abstracts/AbstractEmpresaService';



@Injectable({
  providedIn: 'root'
})
export class EmpresaService extends AbstractEmpresaService {


  private listEmpresas: Empresa[] = [];

  url: string = "http://localhost:4000/empresas";


  //Actualizamos el valor de listEmpresas al cargar.
  constructor(private http: HttpClient) {
    super();
  }


  //Obtenemos las empresas guardades en mongoDB
  getListEmpresas(usuarioId: string): Observable<any> {
    return this.http.get(this.url + "/todas/" + usuarioId);
  }


  //Añadimos la empresa al vector de empresas y luego a la BBDD de mongoDB. 
  addEmpresa(empresa: Empresa): Observable<any> {
    this.listEmpresas.push(empresa);
    return this.http.post(this.url, empresa);
  }


  //Quitamos la empresa del vector de empresas 
  deleteEmpresa(empresaId: Empresa): Observable<any> {
    return this.http.delete(this.url + "/" + empresaId);
  }



  getEmpresaById(_id: string) {
    return this.http.get(this.url + "/" + _id);
  }



  updateEmpresa(empresa: Empresa, empresaId: String | undefined): Observable<any> {
    return this.http.put(this.url + "/" + empresaId, empresa);
  }



  getEmpresaUrl() {
    return this.url;
  }





}
