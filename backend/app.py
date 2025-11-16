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

    return jsonify({'streets': unique_streets[:100]})  # Limitar a 100 para performance

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
        for i, node in enumerate(route):
            if i % 10 == 0:  # Reducir puntos para performance (cada 10 nodos)
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
    geolocator = Nominatim(user_agent="SafeRoute-App")
    
    try:
        # Intentar geocodificar la dirección completa
        location = geolocator.geocode(f"{address}, Lima, Peru")
        print(f"Geocoding result for '{address}': {location}")
        
        if not location:
            # Fallback: intentar con solo el nombre de la calle (sin números)
            street_name = re.sub(r'\d+', '', address).strip()
            if street_name != address:
                print(f"Intentando fallback con nombre de calle: '{street_name}'")
                location = geolocator.geocode(f"{street_name}, Lima, Peru")
                print(f"Fallback geocoding result: {location}")
        
        if not location:
            print(f"No se pudo geocodificar: {address}")
            return None
        
        target_lat, target_lon = location.latitude, location.longitude
        print(f"Coordenadas: {target_lat}, {target_lon}")
        
        # Encontrar el nodo más cercano en el grafo
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