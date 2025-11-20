from flask import Flask, request, jsonify
from flask_cors import CORS
import osmnx as ox
import networkx as nx
import pandas as pd
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
import requests
import re
import threading

app = Flask(__name__)
CORS(app)  # Permitir CORS para el frontend

# Cache para grafos por distrito
graph_cache = {}

def get_lima_graph():
    """Cargar un grafo optimizado de una zona más amplia de Lima"""
    cache_key = "lima_amplio_optimized"
    if cache_key not in graph_cache:
        try:
            print("Cargando grafo optimizado de Lima amplio...")
            # Usar coordenadas más amplias para cubrir más zonas de Lima
            # bbox = (north, south, east, west) - área más grande
            graph = ox.graph_from_bbox(north=-11.85, south=-12.25, east=-76.85, west=-77.20, network_type='drive')
            graph_cache[cache_key] = graph
            print(f"Grafo amplio de Lima cargado: {len(graph.nodes)} nodos, {len(graph.edges)} aristas")
        except Exception as e:
            print(f"Error loading Lima amplio graph: {e}")
            return None
    return graph_cache[cache_key]

def get_graph_for_district(district):
    # Por ahora, usar siempre el grafo de Lima para consistencia
    return get_lima_graph()

@app.route('/api/streets', methods=['GET'])
def get_streets():
    district = request.args.get('district', 'Lima')
    graph = get_graph_for_district(district)
    if graph is None:
        return jsonify({'error': 'No se pudo cargar el grafo para el distrito'}), 500

    # Extraer calles con nombres
    streets = []
    for u, v, data in graph.edges(data=True):
        if 'name' in data and data['name']:
            name = data['name'] if isinstance(data['name'], str) else data['name'][0]
            streets.append({
                'name': name,
                'type': data.get('highway', 'unknown'),
                'length': data.get('length', 0)
            })

    # Remover duplicados
    unique_streets = []
    seen = set()
    for street in streets:
        if street['name'] not in seen:
            unique_streets.append(street)
            seen.add(street['name'])

    # Filtrar por distrito (simular diferentes calles por distrito)
    district_slices = {
        'Lima': slice(0, 100),
        'Jesús María': slice(100, 200),
        'Miraflores': slice(200, 300),
        'San Isidro': slice(300, 400),
        'La Victoria': slice(400, 500),
        'Lince': slice(500, 600)
    }
    slice_obj = district_slices.get(district, slice(0, 100))
    filtered_streets = unique_streets[slice_obj]

    return jsonify({'streets': filtered_streets})

def calculate_route_with_timeout(graph, origin_node, dest_node, timeout_seconds=30):
    """Calcula ruta con timeout para evitar que se quede colgado"""
    result = {'success': False, 'route': None, 'length': None}

    def worker():
        try:
            route = nx.shortest_path(graph, origin_node, dest_node, weight='length')
            route_length = nx.shortest_path_length(graph, origin_node, dest_node, weight='length')
            result['success'] = True
            result['route'] = route
            result['length'] = route_length
        except Exception as e:
            result['error'] = str(e)

    thread = threading.Thread(target=worker)
    thread.start()
    thread.join(timeout_seconds)

    if thread.is_alive():
        return {'success': False, 'error': 'Timeout: cálculo de ruta tomó demasiado tiempo'}

    return result

@app.route('/api/route', methods=['POST'])
def calculate_route():
    data = request.json
    origin_name = data.get('origin')
    destination_name = data.get('destination')
    district = data.get('district', 'Lima')

    print(f"Calculando ruta de '{origin_name}' a '{destination_name}' en {district}")

    if not origin_name or not destination_name:
        return jsonify({'error': 'Se requieren origen y destino'}), 400

    graph = get_graph_for_district(district)
    if graph is None:
        return jsonify({'error': 'No se pudo cargar el grafo de Lima'}), 500

    # Encontrar nodos más cercanos a las direcciones
    origin_node = find_nearest_node(graph, origin_name)
    dest_node = find_nearest_node(graph, destination_name)

    print(f"Nodo origen: {origin_node}, Nodo destino: {dest_node}")

    if origin_node is None or dest_node is None:
        return jsonify({'error': 'No se pudieron encontrar nodos para las direcciones especificadas. Verifica que las direcciones sean correctas y estén en Lima.'}), 404

    # Calcular ruta más corta usando Dijkstra con timeout
    try:
        print("Calculando ruta más corta...")
        route_result = calculate_route_with_timeout(graph, origin_node, dest_node, timeout_seconds=30)

        if not route_result['success']:
            error_msg = route_result.get('error', 'Error desconocido en cálculo de ruta')
            print(f"Error en cálculo de ruta: {error_msg}")
            return jsonify({'error': error_msg}), 408  # Request Timeout

        route = route_result['route']
        route_length = route_result['length']

        # Obtener coordenadas de la ruta
        route_coords = []
        for node in route:
            route_coords.append({
                'lat': graph.nodes[node]['y'],
                'lon': graph.nodes[node]['x']
            })

        print(f"Ruta calculada: {len(route)} nodos, {route_length:.2f} metros")

        # Calcular tiempo estimado (asumiendo 30 km/h promedio en ciudad)
        speed_kmh = 30
        time_hours = (route_length / 1000) / speed_kmh
        time_minutes = time_hours * 60

        return jsonify({
            'route': route_coords,
            'length': route_length,
            'distance_km': route_length / 1000,
            'estimated_time_minutes': round(time_minutes, 1),
            'speed_kmh': speed_kmh
        })
    except nx.NetworkXNoPath:
        return jsonify({'error': 'No hay ruta disponible entre los puntos'}), 404
    except Exception as e:
        print(f"Error calculando ruta: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

def find_nearest_node(graph, address):
    geolocator = Nominatim(user_agent="SafeRoute/1.0", timeout=10)
    
    try:
        # Extraer código postal y determinar distrito para mejor precisión
        postal_districts = {
            '1': 'Lima Centro', '13': 'Jesús María', '22': 'Miraflores', 
            '30': 'San Isidro', '15': 'La Victoria', '16': 'Lince'
        }
        district_hint = ""
        postal_match = re.search(r'Lima\s+(\d+)', address, re.IGNORECASE)
        if postal_match:
            code = postal_match.group(1)
            district_hint = postal_districts.get(code, "")
            if district_hint:
                district_hint = f", {district_hint}"
        
        # Mantener la dirección completa incluyendo códigos postales para mejor precisión
        cleaned_address = address.strip()
        
        # Mejorar la precisión agregando más contexto geográfico
        enhanced_address = f"{cleaned_address}{district_hint}, Lima Metropolitana, Provincia de Lima, Peru"
        location = geolocator.geocode(enhanced_address)
        print(f"Geocoding result for '{address}' -> '{enhanced_address}': {location}")
        
        if not location:
            # Fallback 1: intentar con menos especificidad
            fallback1 = f"{address}, Lima, Peru"
            print(f"Intentando fallback 1: '{fallback1}'")
            location = geolocator.geocode(fallback1)
            print(f"Fallback 1 result: {location}")
        
        if not location:
            # Fallback 2: intentar con solo el nombre de la calle (sin números)
            street_name = re.sub(r'\d+', '', address).strip()
            if street_name != address and street_name:
                fallback2 = f"{street_name}, Lima, Peru"
                print(f"Intentando fallback 2 con nombre de calle: '{fallback2}'")
                location = geolocator.geocode(fallback2)
                print(f"Fallback 2 result: {location}")
        
        if not location:
            print(f"No se pudo geocodificar ninguna variante de: {address}")
            return None
        
        target_lat, target_lon = location.latitude, location.longitude
        print(f"Coordenadas finales: {target_lat}, {target_lon} (precisión: {getattr(location, 'raw', {}).get('importance', 'desconocida')})")
        
        # Validar que las coordenadas estén dentro de Lima Metropolitana
        if not (-12.25 <= target_lat <= -11.85 and -77.20 <= target_lon <= -76.85):
            print(f"Coordenadas fuera de Lima: {target_lat}, {target_lon} - rechazando")
            location = None
        min_distance = float('inf')
        nearest_node = None
        
        for node in graph.nodes():
            node_lat = graph.nodes[node]['y']
            node_lon = graph.nodes[node]['x']
            distance = geodesic((target_lat, target_lon), (node_lat, node_lon)).meters
            
            if distance < min_distance:
                min_distance = distance
                nearest_node = node
        
        print(f"Nodo más cercano encontrado a {min_distance:.2f} metros")
        
        # Solo devolver si está dentro de 2000 metros (aumenté más el radio)
        return nearest_node if min_distance <= 2000 else None
        
    except Exception as e:
        print(f"Error geocoding {address}: {e}")
        return None

if __name__ == '__main__':
    app.run(debug=True, port=5000)