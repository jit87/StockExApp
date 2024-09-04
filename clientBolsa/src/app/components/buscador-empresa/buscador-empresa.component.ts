import { Component, OnInit, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Empresa } from '../../interfaces/Empresa';
import { StockService } from '../../services/stock.service';
import { Location } from '@angular/common';


@Component({
  selector: 'app-buscador-empresa',
  templateUrl: './buscador-empresa.component.html',
  styleUrls: ['./buscador-empresa.component.css']
  
})
export class BuscadorEmpresaComponent implements OnInit {

//Propiedades de la empresa buscada
logo: string | undefined; 
name: string | undefined; 
symbol: string | undefined;  
industry: string | undefined; 
sector: string | undefined;
bolsa: string | undefined;
CEO: string | undefined;
employees: number | undefined;
marketCap: number | undefined;
phone: number | undefined; 
website: string | undefined;
address: string | undefined;
description: string | undefined; 
tags: string | undefined; 
similarCompanies: string | undefined; 

//Propiedad para las noticias
data:any[] = [];

//Propiedad de control
Cargado = 0;


constructor(private activatedRoute:ActivatedRoute, private stockService: StockService, private location: Location ){ }


ngOnInit() {

  this.activatedRoute.params.subscribe(params => {

      var data = this.stockService.getData(params[('ticker')]);
      var news = this.stockService.getNews(params[('ticker')]);
      
      if(data) {
        data.subscribe((empresaData: any) => {
          this.logo = empresaData.logo; 
          this.name = empresaData.name;
          this.symbol = empresaData.symbol;
          this.industry = empresaData.industry;
          this.sector = empresaData.sector;
          this.bolsa  = empresaData.exchange;
          this.CEO = empresaData.ceo;
          this.employees = empresaData.employees;
          this.marketCap = empresaData.marketcap;
          this.phone = empresaData.phone;
          this.website = empresaData.url;
          this.address = empresaData.hq_address;
          this.description = empresaData.description;
          this.tags = empresaData.tags.join(', '); 
          this.similarCompanies = empresaData.similar.join(', '); 
          this.Cargado = 1;
        });
      } 
      else 
      {
        console.error('Error al obtener parámetros');
      }

      if (news) {
        news.subscribe((newsData: any) => {
          this.data = newsData.results.map((element: any) => ({
            title: element.title,
            author: element.author,
            date: element.published_utc,
            url: element.article_url,
            image: element.image_url,
            descr: element.description
          }));
        });
      } 
      else 
      {
        console.error('Error al obtener noticias');
      }

    });

  }





  regresar() {
    this.location.back(); 
    
  }
  










}
