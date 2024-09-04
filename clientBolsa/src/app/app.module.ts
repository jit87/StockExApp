import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthModule, provideAuth0 } from '@auth0/auth0-angular';

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
    APP_ROUTING,
     AuthModule.forRoot({
      domain: "dev-12csjvjuyvgnl25b.eu.auth0.com",
      clientId: "P6CZ7LGou5BKdtmuVaXBKTmKQot0cyTb",
       authorizationParams: {
         redirect_uri: window.location.origin
      }
     })
  ],
  providers: [EmpresaService, StockService, provideAuth0({
      domain: 'dev-12csjvjuyvgnl25b.eu.auth0.com',
      clientId: 'P6CZ7LGou5BKdtmuVaXBKTmKQot0cyTb',
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    })],
  bootstrap: [AppComponent]
})
export class AppModule { }
