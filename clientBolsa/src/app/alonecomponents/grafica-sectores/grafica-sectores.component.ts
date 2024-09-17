import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import $ from 'jquery';

@Component({
  selector: 'app-grafica-sectores',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './grafica-sectores.component.html',
  styleUrl: './grafica-sectores.component.css'
})
export class GraficaSectoresComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    this.initChart();
  }

  initChart(): void {
    const circles = [
      { cx: 200, cy: 200, r: 150, fill: 'lightblue' },
      { cx: 200, cy: 200, r: 100, fill: 'lightcoral' },
      { cx: 200, cy: 200, r: 50, fill: 'lightgreen' }
    ];

    // Seleccionar el elemento SVG
    const $svg = $('#chart');

    // Añadir los círculos al SVG
    circles.forEach(circle => {
      $svg.append(
        `<circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}" fill="${circle.fill}" stroke="black" stroke-width="3"></circle>`
      );
    });

    // Añadir un texto opcional en el centro
    $svg.append(
      `<text x="200" y="200" text-anchor="middle" stroke="#51c5cf" stroke-width="1px" dy=".3em">Gráfico</text>`
    );
  }
 
}
