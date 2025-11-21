# SafeRoute - Sistema de Optimización de Rutas de Emergencia

SafeRoute es una aplicación web moderna para calcular rutas óptimas en Lima Metropolitana, utilizando algoritmos de grafos y datos de OpenStreetMap.

## 🚀 Características

- **Cálculo de Rutas Óptimas**: Utiliza el algoritmo de Dijkstra para encontrar la ruta más eficiente
- **Interfaz Moderna**: Diseño profesional con Tailwind CSS y iconos SVG
- **Mapa Interactivo**: Visualización de rutas con Leaflet
- **Exploración de Calles**: Descubre las calles de diferentes distritos de Lima
- **API REST**: Backend en Flask con procesamiento de datos geoespaciales

## 🏗️ Arquitectura

### Frontend (Next.js + React)
- **Framework**: Next.js 16.0.3 con App Router
- **UI**: Tailwind CSS para estilos modernos y responsivos
- **Mapas**: Leaflet con React-Leaflet para visualización
- **Iconos**: Lucide React para iconografía consistente

### Backend (Flask + Python)
- **Framework**: Flask con CORS habilitado
- **Datos**: OpenStreetMap vía OSMNx para grafos de calles
- **Algoritmos**: NetworkX para cálculo de rutas con Dijkstra
- **Geocoding**: Nominatim para conversión de direcciones a coordenadas

## 📋 Requisitos

- **Python 3.8+** con pip
- **Node.js 18+** con npm
- **Git** para control de versiones

## 🛠️ Instalación y Ejecución

### 1. Clonar el Repositorio
```bash
git clone https://github.com/krxxg04/SafeRoute.git
```

### 2. Configurar el Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
python app.py
```
El backend estará disponible en `http://localhost:5000`

### 3. Configurar el Frontend
```bash
cd saferoute-v1
npm install
npm run dev
```
El frontend estará disponible en `http://localhost:3000`

## ⚡ Ejecución Rápida

### Backend
```powershell
cd backend
.\venv\Scripts\activate
python app.py
```

### Frontend
```powershell
cd saferoute-v1
npm run dev
```

## 🎯 Uso de la Aplicación

### Cálculo de Rutas
1. Ingresa una dirección de origen (ej: "Calle Principal 123, Lima")
2. Ingresa una dirección de destino (ej: "Avenida Central 456, Lima")
3. Haz clic en "Calcular Ruta Óptima"
4. Visualiza la ruta en el mapa con métricas de distancia, tiempo y velocidad

## 🔧 Tecnologías Utilizadas

### Frontend
- **Next.js**: Framework React con SSR/SSG
- **React 19**: Biblioteca para interfaces de usuario
- **TypeScript**: JavaScript tipado
- **Tailwind CSS**: Framework CSS utilitario
- **Leaflet**: Biblioteca de mapas
- **Lucide React**: Iconos SVG

### Backend
- **Flask**: Framework web Python
- **OSMNx**: Extracción de datos de OpenStreetMap
- **NetworkX**: Análisis de grafos
- **Geopy**: Geocoding con Nominatim
- **Pandas**: Manipulación de datos

## 📊 Algoritmo

SafeRoute utiliza el **algoritmo de Dijkstra** para encontrar la ruta más corta entre dos puntos en el grafo de calles de Lima. El algoritmo considera:

- Distancia real entre intersecciones
- Conexiones viales existentes
- Optimización para rutas de emergencia

## 🌍 Datos Geográficos

Los datos de calles provienen de **OpenStreetMap** y cubren Lima Metropolitana con:

- Más de 10,000 nodos de intersección
- Información actualizada de vías vehiculares
- Cobertura completa de distritos principales

## 🚨 Casos de Uso

- **Servicios de Emergencia**: Rutas óptimas para ambulancias y bomberos
- **Logística Urbana**: Optimización de entregas en ciudad
- **Planificación Vial**: Análisis de conectividad urbana
- **Navegación Urbana**: Alternativas a aplicaciones comerciales

## 👥 Autor

**krxxg04** - Desarrollo del proyecto SafeRoute

---

*Proyecto desarrollado para la optimización de rutas de emergencia en Lima Metropolitana utilizando algoritmos de grafos avanzados.*
