import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Layers, Edit, Maximize2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  height?: string;
  interactive?: boolean;
}

function LayerControl() {
  const [currentLayer, setCurrentLayer] = useState<'openstreetmap' | 'satellite' | 'hybrid'>('openstreetmap');
  const map = useMap();

  const switchLayer = (layerType: typeof currentLayer) => {
    setCurrentLayer(layerType);
    
    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add new tile layer
    let tileLayer: L.TileLayer;
    switch (layerType) {
      case 'satellite':
        tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });
        break;
      case 'hybrid':
        tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google'
        });
        break;
      default:
        tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
    }

    tileLayer.addTo(map);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
      <Button
        size="sm"
        variant={currentLayer === 'openstreetmap' ? "default" : "secondary"}
        onClick={() => switchLayer('openstreetmap')}
        data-testid="layer-openstreetmap"
      >
        Street
      </Button>
      <Button
        size="sm"
        variant={currentLayer === 'satellite' ? "default" : "secondary"}
        onClick={() => switchLayer('satellite')}
        data-testid="layer-satellite"
      >
        Satellite
      </Button>
      <Button
        size="sm"
        variant={currentLayer === 'hybrid' ? "default" : "secondary"}
        onClick={() => switchLayer('hybrid')}
        data-testid="layer-hybrid"
      >
        Hybrid
      </Button>
    </div>
  );
}

export function MapComponent({ height = "500px", interactive = true }: MapComponentProps) {
  const mapRef = useRef<L.Map>(null);
  const [drawnShapes, setDrawnShapes] = useState<any[]>([]);
  
  const { data: mapData, isLoading } = useQuery({
    queryKey: ["/api/map/claims"],
    queryFn: api.getMapClaims,
  });

  const handleDrawCreated = (e: any) => {
    const { layer } = e;
    const geoJson = layer.toGeoJSON();
    setDrawnShapes(prev => [...prev, geoJson]);
    
    // In a real app, you'd save this to the backend
    console.log("New shape drawn:", geoJson);
  };

  const handleDrawEdited = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: any) => {
      const geoJson = layer.toGeoJSON();
      console.log("Shape edited:", geoJson);
    });
  };

  const handleDrawDeleted = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: any) => {
      console.log("Shape deleted");
    });
  };

  // Style function for claim boundaries
  const getClaimStyle = (feature: any) => {
    const status = feature.properties.status;
    let color = '#3b82f6'; // Default blue
    
    switch (status) {
      case 'approved':
        color = '#10b981'; // Green
        break;
      case 'rejected':
        color = '#ef4444'; // Red
        break;
      case 'review_required':
        color = '#f59e0b'; // Yellow
        break;
      default:
        color = '#6b7280'; // Gray for pending
    }

    return {
      color,
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.3,
    };
  };

  // Popup content for claims
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties;
    const popupContent = `
      <div class="p-2">
        <h4 class="font-semibold text-sm">${props.claimId}</h4>
        <p class="text-xs text-gray-600">Claimant: ${props.claimantName}</p>
        <p class="text-xs text-gray-600">Village: ${props.village}</p>
        <p class="text-xs text-gray-600">Area: ${props.area} hectares</p>
        <span class="inline-block mt-1 px-2 py-1 text-xs rounded ${
          props.status === 'approved' ? 'bg-green-100 text-green-800' :
          props.status === 'rejected' ? 'bg-red-100 text-red-800' :
          props.status === 'review_required' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }">
          ${props.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
    `;
    layer.bindPopup(popupContent);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Interactive Map
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="secondary"
              data-testid="button-layers"
            >
              <Layers className="mr-2 h-4 w-4" />
              Layers
            </Button>
            <Button 
              size="sm"
              data-testid="button-draw"
            >
              <Edit className="mr-2 h-4 w-4" />
              Draw
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              data-testid="button-fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          className="relative overflow-hidden rounded-b-lg"
          style={{ height }}
          data-testid="map-container"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full bg-muted">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading map data...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              ref={mapRef}
              center={[20.0, 77.0]} // Center of India
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              data-testid="leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <LayerControl />
              
              {/* Render claim boundaries */}
              {mapData && mapData.features && (
                <GeoJSON
                  data={mapData}
                  style={getClaimStyle}
                  onEachFeature={onEachFeature}
                />
              )}

              {/* Drawing controls - temporarily disabled due to configuration issues */}
              {false && interactive && (
                <FeatureGroup>
                  <EditControl
                    position="topleft"
                    onCreated={handleDrawCreated}
                    onEdited={handleDrawEdited}
                    onDeleted={handleDrawDeleted}
                    draw={{
                      rectangle: {},
                      polygon: {},
                      circle: false,
                      circlemarker: false,
                      marker: {},
                      polyline: false,
                    }}
                    edit={{
                      edit: true,
                      remove: true,
                    }}
                  />
                </FeatureGroup>
              )}
            </MapContainer>
          )}
        </div>

        {/* Map Legend */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-accent rounded mr-2"></div>
                  <span className="text-muted-foreground">Approved Claims</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-chart-1 rounded mr-2"></div>
                  <span className="text-muted-foreground">Pending Claims</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-chart-2 rounded mr-2"></div>
                  <span className="text-muted-foreground">Review Required</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <span>Zoom: 6 | Claims visible: {mapData?.features?.length || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
