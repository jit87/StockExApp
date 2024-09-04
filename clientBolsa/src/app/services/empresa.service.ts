// empresa.service.ts
import { Injectable } from '@angular/core';
import { Empresa } from '../interfaces/Empresa';



@Injectable({
  providedIn: 'root'
})
export class EmpresaService {


  private listEmpresas: Empresa[] = [];

  //Actualizamos el valor de listEmpresas al cargar.
  constructor() {
    const storedData = localStorage.getItem('Acciones');
    if (storedData) {
      this.listEmpresas = JSON.parse(storedData);
    }
  }

  getListEmpresas(): Empresa[] {
    return this.listEmpresas;
  }


  //Añadimos la empresa al vector de empresas y luego al LocalStorage. 
  //Sustituir por backend en caso de utilizar BBDD.
  addEmpresa(empresa: Empresa) {
    this.listEmpresas.push(empresa);
    localStorage.setItem("Acciones", JSON.stringify(this.listEmpresas));
  }


  //Quitamos la empresa del vector de empresas y luego actualizamos el LocalStorage.
  deleteEmpresa(empresa: Empresa) {
    var index =  this.listEmpresas.indexOf(empresa);
    this.listEmpresas.splice(index, 1);
    localStorage.setItem('Acciones', JSON.stringify(this.listEmpresas));
  }





}
