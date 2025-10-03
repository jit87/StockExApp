# StockExApp

Aplicación de bolsa desarrollada con el stack MEAN (MongoDB, Express, Angular, Node.js). Permite a los usuarios consultar información bursátil en tiempo real y acceder a datos históricos mediante diversas APIs.

## Funcionalidades

- **Cotizaciones en tiempo real**: visualiza precios actualizados al instante.
- **Crear cartera de acciones**: añade acciones a tu cartera de inversión.
- **Gráficos interactivos**: se adaptan a tu cartera dinámicamente y ayudan a visualizar los diferentes sectores.
- **Información sobre dividendos**: proporciona información sobre dividendos a cobrar.
- **Consejos básicos**: en función de tu cartera, da orientaciones básicas sobre diversificación.
- **Información actualizada**: últimas noticias del mercado y de las empresas.

![Captura de Dashboard](https://raw.githubusercontent.com/jit87/StockExApp/main/clientBolsa/src/app/assets/Captura-Dashboard.png)

![Captura de Dashboard2](https://raw.githubusercontent.com/jit87/StockExApp/main/clientBolsa/src/app/assets/Captura-Dashboard2.png)

![Captura de Dashboard3](https://raw.githubusercontent.com/jit87/StockExApp/main/clientBolsa/src/app/assets/Captura-Dashboard3.png)

![Captura de Noticias](https://raw.githubusercontent.com/jit87/StockExApp/main/clientBolsa/src/app/assets/Captura-Noticias.png)

![Captura de Dividendos](https://raw.githubusercontent.com/jit87/StockExApp/main/clientBolsa/src/app/assets/Captura-Dividendos.png)

![Captura de Info](https://raw.githubusercontent.com/jit87/StockExApp/main/clientBolsa/src/app/assets/Captura-InfoAccion.png)

![Captura de Perfil](https://raw.githubusercontent.com/jit87/StockExApp/main/clientBolsa/src/app/assets/Captura-Perfil.png)

## Tecnologías Utilizadas

- **Frontend**: Angular 18
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
npm run dev
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
npm run dev
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

- **Real-time quotes**: View prices updated instantly.
- **Create stock portfolio**: Add stocks to your portfolio.
- **Interactive charts**: Adapt to your portfolio dynamically and help visualize different sectors.
- **Dividend information**: Provides information about dividends to be received.
- **Basic tips**: Offers basic guidance on diversification based on your portfolio.
- **Updated information**: Latest news from the market and companies.

## Technologies Used

- **Frontend**: Angular 18
- **Backend**: Node.js 14 with Express 4
- **Database**: MongoDB
- **Integrated APIs**:
  - [Polygon](https://polygon.io/)
  - [Finnhub](https://finnhub.io/)
  - [AlphaVantage](https://www.alphavantage.co/)

## Project Structure

- `/clientBolsa`: Frontend built with Angular.
- `/serverBolsa`: Backend developed with Express and Node.js.


# Installation and Running of StockExApp

Follow these steps to install and run the **StockExApp** on your local environment.

---

## **1. Clone the Repository**

Clone the repository from GitHub using the following command:

```bash
git clone https://github.com/jit87/StockExApp.git
```

---

## **2. Set Up the Backend**

### **2.1. Go to the Backend Directory**

Navigate to the `serverBolsa` directory:

```bash
cd StockExApp/serverBolsa
```

### **2.2. Install Dependencies**

Run the following command to install the necessary dependencies:

```bash
npm install
```

### **2.3. Set Up Environment Variables**

Create a `.env` file in the `serverBolsa` directory with the following content, replacing `your_key` with your API keys:

```env
FINNHUB_API_KEY=your_key
ALPHA_VANTAGE_API_KEY=your_key
POLYGON_API_KEY=your_key
```

### **2.4. Start the Server**

Run the following command to start the backend server:

```bash
npm run dev
```

By default, the server runs on `http://localhost:4000`.

---

## **3. Set Up the Frontend**

### **3.1. Go to the Frontend Directory**

Navigate to the `clientBolsa` directory:

```bash
cd ../clientBolsa
```

### **3.2. Install Dependencies**

Run the following command to install the necessary dependencies:

```bash
npm install
```

### **3.3. Start the Development Server**

Run the following command to start the frontend server:

```bash
npm run dev
```

By default, the frontend runs on `http://localhost:4200`.

---

## **4. Access the Application**

1. Open your web browser.
2. Make sure the backend is running on `http://localhost:4000`.
3. Go to the frontend at `http://localhost:4200` to use the application.

---

## **Additional Notes**

- Make sure you have Node.js installed (version 14 or higher).
- Install `npm` if it is not available.
- Ensure you have internet access to fetch data from the APIs.

If you encounter any issues during installation, feel free to open an issue on the repository.


