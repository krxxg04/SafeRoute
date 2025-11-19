'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Home as HomeIcon, Target, Rocket, Map, Navigation, Brain, Globe, Zap, MapPin, Search } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* Header Hero Section */}
      <div className="bg-gradient-to-r from-[#1F4E79] via-[#2A6AA0] to-[#4A90E2] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-2xl p-6 border-2 border-white/30 shadow-2xl">
                <img 
                  src="/SafeRoute.png" 
                  alt="SafeRoute Logo" 
                  className="w-40 h-40 object-contain"
                />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              SafeRoute
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Sistema Profesional de Optimización de Rutas de Emergencia
            </p>
            <div className="mt-6 flex justify-center space-x-4 text-sm text-slate-400">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-[#1F4E79] rounded-full mr-2"></span>
                Algoritmo Dijkstra
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-[#4A90E2] rounded-full mr-2"></span>
                Datos OpenStreetMap
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-[#8ED1FC] rounded-full mr-2"></span>
                Optimización Tiempo Real
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Route Calculator Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-r from-[#1F4E79] to-[#2A6AA0] p-6">
              <div className="flex items-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mr-4 border border-white/20">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Calcular Ruta</h2>
                  <p className="text-slate-300">Encuentra la ruta más eficiente</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <HomeIcon className="w-5 h-5 mr-2 text-gray-600" />
                    Punto de Origen
                  </label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Ej: Jiron Mateo Pumacahua 1567"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-slate-500 focus:ring-4 focus:ring-slate-100 transition-all duration-200 text-gray-700 placeholder-gray-400 bg-white shadow-sm"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-gray-600" />
                    Punto de Destino
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ej: Av Salaverry 2255"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-slate-500 focus:ring-4 focus:ring-slate-100 transition-all duration-200 text-gray-700 placeholder-gray-400 bg-white shadow-sm"
                  />
                </div>

                <button
                  onClick={calculateRoute}
                  disabled={loading || !origin || !destination}
                  className="w-full bg-gradient-to-r from-[#1F4E79] to-[#2A6AA0] hover:from-[#2A6AA0] hover:to-[#4A90E2] disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-[#1F4E79]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Calculando ruta...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Rocket className="w-5 h-5 mr-3 text-white" />
                      Calcular Ruta Óptima
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Street Explorer Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-r from-[#2A6AA0] to-[#4A90E2] p-6">
              <div className="flex items-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mr-4 border border-white/20">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Explorar Calles</h2>
                  <p className="text-blue-200">Descubre las calles de Lima</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-gray-600" />
                    Distrito
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-700 bg-white shadow-sm"
                  >
                    <option value="Lima">Lima Centro</option>
                    <option value="Jesús María">Jesús María</option>
                    <option value="Miraflores">Miraflores</option>
                    <option value="San Isidro">San Isidro</option>
                    <option value="La Victoria">La Victoria</option>
                    <option value="Lince">Lince</option>
                  </select>
                </div>

                <button
                  onClick={fetchStreets}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#2A6AA0] to-[#4A90E2] hover:from-[#4A90E2] hover:to-[#6FB2F2] disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-[#2A6AA0]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Buscando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Search className="w-5 h-5 mr-3 text-white" />
                      Explorar Calles
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Route Results */}
        {route && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-[#1F4E79] via-[#2A6AA0] to-[#4A90E2] rounded-2xl p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mr-4 border border-white/20">
                    <img 
                      src="/SafeRoute.png" 
                      alt="SafeRoute" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Ruta Óptima Calculada</h3>
                    <p className="text-slate-300">Ruta más eficiente encontrada</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400 mb-1">Algoritmo</div>
                  <div className="font-bold text-lg">Dijkstra</div>
                  <div className="text-xs text-slate-500">OpenStreetMap</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">📏</span>
                    <div>
                      <p className="text-sm text-blue-200">Distancia Total</p>
                      <p className="text-3xl font-bold">{route.distance_km.toFixed(2)} <span className="text-lg">km</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">⏱️</span>
                    <div>
                      <p className="text-sm text-blue-200">Tiempo Estimado</p>
                      <p className="text-3xl font-bold">{route.estimated_time_minutes.toFixed(1)} <span className="text-lg">min</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">🚗</span>
                    <div>
                      <p className="text-sm text-blue-200">Velocidad Promedio</p>
                      <p className="text-3xl font-bold">{route.speed_kmh} <span className="text-lg">km/h</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Section */}
        {route && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-12">
            <div className="bg-gradient-to-r from-[#1F4E79] to-[#2A6AA0] p-6">
              <div className="flex items-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mr-4 border border-white/20">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Mapa Interactivo</h2>
                  <p className="text-slate-300">Visualización de la ruta óptima</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="h-96 lg:h-[600px] rounded-xl overflow-hidden shadow-lg">
                <MapComponent streets={[]} route={route} />
              </div>
              <div className="mt-6 flex justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2 border-2 border-white shadow-sm"></div>
                  <span>Origen</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2 border-2 border-white shadow-sm"></div>
                  <span>Destino</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-1 bg-blue-500 rounded mr-2"></div>
                  <span>Ruta Óptima</span>
                </div>
              </div>
              <p className="text-center text-gray-500 mt-4">
                Haz clic en la ruta para ver detalles adicionales
              </p>
            </div>
          </div>
        )}

        {/* Streets List */}
        {streets.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1F4E79] to-[#2A6AA0] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mr-4 border border-white/20">
                    <span className="text-2xl">🛣️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Calles Encontradas</h2>
                    <p className="text-slate-300">{streets.length} calles en {district}</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                  <span className="text-white font-bold">{streets.length}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {streets.slice(0, 50).map((street, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🏢</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm leading-tight">{street.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 capitalize">{street.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {streets.length > 50 && (
                <div className="text-center mt-6">
                  <p className="text-gray-500 bg-gray-50 px-4 py-2 rounded-lg inline-block">
                    ... y {streets.length - 50} calles más
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="flex justify-center space-x-8 mb-6">
              <div className="text-center">
                <Brain className="w-8 h-8 mb-2 text-blue-600 mx-auto" />
                <div className="text-sm font-semibold text-gray-700">Algoritmo Avanzado</div>
                <div className="text-xs text-gray-500">Dijkstra Optimizado</div>
              </div>
              <div className="text-center">
                <Globe className="w-8 h-8 mb-2 text-green-600 mx-auto" />
                <div className="text-sm font-semibold text-gray-700">Datos Actualizados</div>
                <div className="text-xs text-gray-500">OpenStreetMap</div>
              </div>
              <div className="text-center">
                <Zap className="w-8 h-8 mb-2 text-yellow-600 mx-auto" />
                <div className="text-sm font-semibold text-gray-700">Cálculo Rápido</div>
                <div className="text-xs text-gray-500">Procesamiento Instantáneo</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              SafeRoute - Optimizando rutas de emergencia en Lima Metropolitana
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
