'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Street {
  name: string;
  type: string;
  length: number;
}

interface Route {
  route: { lat: number; lon: number }[];
  length: number;
  distance_km: number;
  estimated_time_minutes: number;
  speed_kmh: number;
}

interface MapComponentProps {
  streets: Street[];
  route?: Route | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ streets, route }) => {
  useEffect(() => {
    // Inicializar el mapa solo una vez
    const map = L.map('map').setView([-12.0464, -77.0428], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Guardar referencia al mapa
    (window as any).mapInstance = map;

    return () => {
      map.remove();
    };
  }, []);

  // Efecto para actualizar la ruta
  useEffect(() => {
    const map = (window as any).mapInstance;
    if (!map) return;

    // Limpiar capas anteriores
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    if (route && route.route && route.route.length > 0) {
      const startCoord = route.route[0];
      const endCoord = route.route[route.route.length - 1];

      // Marcador de origen (verde)
      L.marker([startCoord.lat, startCoord.lon], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map).bindPopup('<b>🚦 Origen</b>');

      // Marcador de destino (rojo)
      L.marker([endCoord.lat, endCoord.lon], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map).bindPopup('<b>🏁 Destino</b>');

      // Ruta en azul
      const routeLatLngs = route.route.map(coord => [coord.lat, coord.lon] as [number, number]);
      const routeLine = L.polyline(routeLatLngs, {
        color: '#2563eb',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Popup informativo
      const popupContent = `
        <div style="font-family: system-ui, sans-serif; max-width: 280px; line-height: 1.4;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">Ruta SafeRoute</h3>
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1;">
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <span><strong>Distancia:</strong> ${route.distance_km.toFixed(2)} km</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <span><strong>Tiempo estimado:</strong> ${route.estimated_time_minutes.toFixed(1)} min</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span><strong>Velocidad:</strong> ${route.speed_kmh} km/h</span>
            </div>
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #64748b; text-align: center;">
            Algoritmo de Dijkstra • OpenStreetMap
          </div>
        </div>
      `;

      routeLine.bindPopup(popupContent);

      // Centrar el mapa en la ruta
      const bounds = L.latLngBounds(routeLatLngs);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [route]);

  return <div id="map" style={{ height: '100%', width: '100%', minHeight: '500px', borderRadius: '8px' }} />;
};

export default MapComponent;