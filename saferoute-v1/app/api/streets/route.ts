import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district') || 'Lima';

  try {
    // Primero, obtener el bbox del distrito usando Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(district + ', Lima, Peru')}&format=json&limit=1`;
    const nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'SafeRoute-App/1.0',
      },
    });

    if (!nominatimResponse.ok) {
      throw new Error('Error fetching bbox from Nominatim');
    }

    const nominatimData = await nominatimResponse.json();

    if (nominatimData.length === 0) {
      return NextResponse.json({ streets: [], message: 'Distrito no encontrado' });
    }

    const bbox = nominatimData[0].boundingbox;
    const south = parseFloat(bbox[0]);
    const north = parseFloat(bbox[1]);
    const west = parseFloat(bbox[2]);
    const east = parseFloat(bbox[3]);

    // Consulta Overpass usando el bbox
    const overpassQuery = `
      [out:json][timeout:25][bbox:${south},${west},${north},${east}];
      (
        way["highway"]["name"];
        node(w);
      );
      out body;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error('Error fetching data from Overpass API');
    }

    const data = await response.json();

    // Separar nodes y ways
    const nodes = data.elements.filter((el: any) => el.type === 'node');
    const ways = data.elements.filter((el: any) => el.type === 'way' && el.tags?.name);

    // Crear un mapa de node id a coordenadas
    const nodeCoords: { [id: number]: { lat: number; lon: number } } = {};
    nodes.forEach((node: any) => {
      nodeCoords[node.id] = { lat: node.lat, lon: node.lon };
    });

    // Procesar las ways para incluir coordenadas
    const streets = ways.map((way: any) => ({
      id: way.id,
      name: way.tags.name,
      type: way.tags.highway,
      nodes: way.nodes,
      coordinates: way.nodes.map((nodeId: number) => nodeCoords[nodeId]).filter(Boolean),
    }));

    return NextResponse.json({ streets });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch streets data' }, { status: 500 });
  }
}