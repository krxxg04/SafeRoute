'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Cargar el mapa dinámicamente para evitar errores de SSR
const MapComponent = dynamic(() => import('./components/MapComponent'), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
});

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

export default function Home() {
  const [district, setDistrict] = useState('Lima');
  const [streets, setStreets] = useState<Street[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStreets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/streets?district=${encodeURIComponent(district)}`);
      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
        setStreets([]);
      } else {
        setStreets(data.streets || []);
      }
    } catch (error) {
      console.error('Error fetching streets:', error);
      alert('Error al conectar con el backend Python. Asegúrate de que esté corriendo en el puerto 5000.');
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = async () => {
    if (!origin || !destination) {
      alert('Por favor ingresa origen y destino');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
          district,
        }),
      });
      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
        setRoute(null);
      } else {
        setRoute(data);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      alert('Error al calcular la ruta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">SafeRoute - Optimización de Rutas de Emergencia</h1>
        <p className="text-lg text-center mb-8 text-gray-600">
          Sistema para reducir tiempos de respuesta en emergencias en Lima Metropolitana.
        </p>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Buscar Calles por Distrito</h2>
          <div className="flex gap-4 mb-4">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            >
              <option value="Lima">Lima</option>
              <option value="Jesús María">Jesús María</option>
              <option value="Miraflores">Miraflores</option>
              <option value="San Isidro">San Isidro</option>
              <option value="La Victoria">La Victoria</option>
              <option value="Lince">Lince</option>
            </select>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="O ingrese otro distrito"
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            <button
              onClick={fetchStreets}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Cargando...' : 'Buscar'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Calcular Ruta</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Calle de origen"
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Calle de destino"
              className="p-2 border border-gray-300 rounded"
            />
            <button
              onClick={calculateRoute}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {loading ? 'Calculando...' : 'Calcular Ruta'}
            </button>
          </div>
          {route && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">🚑 Ruta Calculada</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">📏</span>
                      <div>
                        <p className="text-sm text-gray-600">Distancia</p>
                        <p className="text-xl font-bold text-blue-900">{route.distance_km.toFixed(2)} km</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">⏱️</span>
                      <div>
                        <p className="text-sm text-gray-600">Tiempo estimado</p>
                        <p className="text-xl font-bold text-blue-900">{route.estimated_time_minutes.toFixed(1)} min</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🚗</span>
                      <div>
                        <p className="text-sm text-gray-600">Velocidad promedio</p>
                        <p className="text-xl font-bold text-blue-900">{route.speed_kmh} km/h</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Algoritmo usado:</div>
                  <div className="font-medium text-blue-700">Dijkstra</div>
                  <div className="text-xs text-gray-400">OpenStreetMap</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mapa siempre visible cuando hay ruta */}
        {route && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">🗺️ Mapa de Ruta</h2>
            <div className="h-96 lg:h-[500px]">
              <MapComponent streets={[]} route={route} />
            </div>
            <div className="mt-4 text-sm text-gray-600 text-center">
              Haz clic en la ruta para ver detalles • Marcadores: 🟢 Origen, 🔴 Destino
            </div>
          </div>
        )}

        {streets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Calles Encontradas ({streets.length})</h2>
              <div className="max-h-96 overflow-y-auto">
                {streets.slice(0, 50).map((street, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded mb-2 hover:bg-gray-50">
                    <strong>{street.name}</strong>
                    <span className="text-gray-500 text-sm ml-2">- {street.type}</span>
                  </div>
                ))}
                {streets.length > 50 && <p className="text-gray-500 text-sm">... y {streets.length - 50} más</p>}
              </div>
            </div>

            {!route && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Mapa</h2>
                <div className="h-96">
                  <MapComponent streets={streets} route={null} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
