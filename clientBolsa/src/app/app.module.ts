import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';



//Rutas
import { APP_ROUTING } from './app.routes';

// Componentes
import { AppComponent } from './app.component';


// Servicios
import { EmpresaService } from './services/empresa.service';
import { StockService } from './services/stock.service';
import { ComponentsModule } from './components/components.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    ComponentsModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule, 
    BrowserAnimationsModule,
    ToastrModule.forRoot(), 
    APP_ROUTING
  ],
  providers: [EmpresaService, StockService,],
  bootstrap: [AppComponent]
})
export class AppModule { }
