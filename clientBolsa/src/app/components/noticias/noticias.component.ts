import { Component } from '@angular/core';
import { StockData } from '../../abstracts/stock-data';


@Component({
  selector: 'app-noticias',
  templateUrl: './noticias.component.html',
  styleUrl: './noticias.component.css'
})
export class NoticiasComponent {

  constructor(private _stockService: StockData) {
    this.getNoticias();
  }

  //Propiedad para las noticias
  data: any[] = [];

  //Propiedad de control
  Cargado = 0;

  //Disponibilidad del recurso
  disponible: boolean = true;




  getNoticias() {
    this._stockService.getGeneralNews().subscribe(
      (resp: any) => {
        console.log(resp);
        this.data = resp.results.map((element: any) => ({
          title: element.title,
          author: element.author,
          date: element.published_utc,
          url: element.article_url,
          image: element.image_url,
          descr: element.description
        }));
        this.Cargado = 1;
      },
      (err) => {
        console.log(err);
        this.disponible = false;
      }
    )
  }



}
