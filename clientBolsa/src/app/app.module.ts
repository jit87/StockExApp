import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthcomponentsModule } from './authcomponents/authcomponents.module';


//Rutas
import { APP_ROUTING } from './app.routes';

// Componentes
import { AppComponent } from './app.component';
import { AuthInterceptor } from './interceptors/auth-interceptor.interceptor';

// Servicios
import { EmpresaService } from './services/empresa.service';
import { StockService } from './services/stock.service';
import { ComponentsModule } from './components/components.module';
import { GraficaSectoresComponent } from './alonecomponents/grafica-sectores/grafica-sectores.component';
import { DecimalPipe } from '@angular/common';
import { StockData } from './abstracts/stock-data';


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
    APP_ROUTING,
    AuthcomponentsModule
  ],
  providers: [EmpresaService, StockService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: StockData,
      useClass: StockService
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
