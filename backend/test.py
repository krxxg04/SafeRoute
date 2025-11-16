from app import get_lima_graph, find_nearest_node

print("Probando carga del grafo...")
graph = get_lima_graph()
if graph is None:
    print("Error: No se pudo cargar el grafo")
else:
    print(f"Grafo cargado: {len(graph.nodes)} nodos, {len(graph.edges)} aristas")

    print("Probando geocodificación...")
    node = find_nearest_node(graph, "Jiron Mateo Pumacahua 1567")
    if node is None:
        print("Error: No se pudo encontrar nodo para la dirección")
    else:
        print(f"Nodo encontrado: {node}")