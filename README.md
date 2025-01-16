# StockExApp

Aplicación de bolsa desarrollada con el stack MEAN (MongoDB, Express, Angular, Node.js). Permite a los usuarios consultar información bursátil en tiempo real y acceder a datos históricos mediante diversas APIs.

## Funcionalidades

- **Cotizaciones en tiempo real**: Visualiza precios actualizados al instante.
- **Historial de precios**: Accede a datos históricos de acciones.
- **Gráficos interactivos**: Analiza tendencias del mercado con visualizaciones dinámicas.

## Tecnologías Utilizadas

- **Frontend**: Angular 12
- **Backend**: Node.js 14 con Express 4
- **Base de Datos**: MongoDB
- **APIs Integradas**:
  - [Polygon](https://polygon.io/)
  - [Finnhub](https://finnhub.io/)
  - [AlphaVantage](https://www.alphavantage.co/)

## Estructura del Proyecto

- `/clientBolsa`: Frontend en Angular.
- `/serverBolsa`: Backend con Express y Node.js.

# Instalación y Ejecución de StockExApp

Sigue estos pasos para instalar y ejecutar la aplicación **StockExApp** en tu entorno local.

---

## **1. Clonar el Repositorio**

Clona el repositorio desde GitHub usando el siguiente comando:

```bash
git clone https://github.com/jit87/StockExApp.git
```

---

## **2. Configurar el Backend**

### **2.1. Ir al Directorio del Backend**

Navega al directorio `serverBolsa`:

```bash
cd StockExApp/serverBolsa
```

### **2.2. Instalar Dependencias**

Ejecuta el siguiente comando para instalar las dependencias necesarias:

```bash
npm install
```

### **2.3. Configurar las Variables de Entorno**

Crea un archivo `.env` en el directorio `serverBolsa` con el siguiente contenido, reemplazando `your_key` por tus claves de las APIs correspondientes:

```env
FINNHUB_API_KEY=your_key
ALPHA_VANTAGE_API_KEY=your_key
POLYGON_API_KEY=your_key
```

### **2.4. Iniciar el Servidor**

Ejecuta el siguiente comando para iniciar el servidor backend:

```bash
npm start
```

Por defecto, el servidor se ejecuta en `http://localhost:4000`.

---

## **3. Configurar el Frontend**

### **3.1. Ir al Directorio del Frontend**

Navega al directorio `clientBolsa`:

```bash
cd ../clientBolsa
```

### **3.2. Instalar Dependencias**

Ejecuta el siguiente comando para instalar las dependencias necesarias:

```bash
npm install
```

### **3.3. Iniciar el Servidor de Desarrollo**

Ejecuta el siguiente comando para iniciar el servidor frontend:

```bash
npm start
```

Por defecto, el frontend se ejecuta en `http://localhost:4200`.

---

## **4. Acceso a la Aplicación**

1. Abre tu navegador web.
2. Asegúrate de que el backend esté corriendo en `http://localhost:4000`.
3. Ve al frontend en `http://localhost:4200` para usar la aplicación.

---

## **Notas Adicionales**

- Asegúrate de que tienes Node.js instalado (versión 14 o superior).
- Instala `npm` si no lo tienes disponible.
- Comprueba que tienes acceso a internet para obtener los datos de las APIs.

Si encuentras algún problema durante la instalación, no dudes en abrir un issue en el repositorio.



---------------------------------------------------

# StockExApp

Stock market application developed with the MEAN stack (MongoDB, Express, Angular, Node.js). It allows users to access real-time stock market data and historical records through various APIs.

## Features

- **Real-Time quotes**: View live price updates instantly.
- **Price history**: Access historical stock price data.
- **Interactive charts**: Analyze market trends with dynamic visualizations.

## Technologies Used

- **Frontend**: Angular 12
- **Backend**: Node.js 14 with Express 4
- **Database**: MongoDB
- **Integrated APIs**:
  - [Polygon](https://polygon.io/)
  - [Finnhub](https://finnhub.io/)
  - [AlphaVantage](https://www.alphavantage.co/)

## Project Structure

- `/clientBolsa`: Frontend built with Angular.
- `/serverBolsa`: Backend developed with Express and Node.js.

