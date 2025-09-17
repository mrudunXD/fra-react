import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, GeoJSON, useMap, Marker } from "react-leaflet";
import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { Layers, Edit, Maximize2, Search, Filter, MapPin, Target, ZoomIn } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EnhancedMapProps {
  height?: string;
  interactive?: boolean;
}

interface MapFilters {
  status: string;
  state: string;
  district: string;
  village: string;
  searchTerm: string;
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
    <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2 bg-white/90 backdrop-blur rounded-lg p-2 shadow-lg">
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

function ZoomToFeaturesControl({ features }: { features: any[] }) {
  const map = useMap();

  const zoomToFeatures = () => {
    if (features.length === 0) return;

    const bounds = L.latLngBounds([]);
    features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        bounds.extend([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
      } else if (feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0];
        coords.forEach((coord: number[]) => bounds.extend([coord[1], coord[0]]));
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-lg p-2 shadow-lg">
      <Button
        size="sm"
        onClick={zoomToFeatures}
        disabled={features.length === 0}
      >
        <Target className="mr-2 h-4 w-4" />
        Zoom to Claims
      </Button>
    </div>
  );
}

export function EnhancedMapComponent({ height = "500px", interactive = true }: EnhancedMapProps) {
  const mapRef = useRef<L.Map>(null);
  const [drawnShapes, setDrawnShapes] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showVillageBoundaries, setShowVillageBoundaries] = useState(false);
  const [showClaimBoundaries, setShowClaimBoundaries] = useState(true);
  const [filters, setFilters] = useState<MapFilters>({
    status: 'all',
    state: 'all',
    district: 'all',
    village: 'all',
    searchTerm: ''
  });
  
  const { data: mapData, isLoading } = useQuery({
    queryKey: ["/api/map/claims"],
    queryFn: api.getMapClaims,
  });

  // Mock village boundaries data - in production this would come from API
  const villageBoundariesData = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "Kachargaon",
          district: "Gadchiroli",
          state: "Maharashtra"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[[
            78.1234, 20.1234,
            78.1534, 20.1234,
            78.1534, 20.1534,
            78.1234, 20.1534,
            78.1234, 20.1234
          ]]]
        }
      },
      {
        type: "Feature",
        properties: {
          name: "Bamni",
          district: "Gadchiroli",
          state: "Maharashtra"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[[
            78.2234, 20.2234,
            78.2534, 20.2234,
            78.2534, 20.2534,
            78.2234, 20.2534,
            78.2234, 20.2234
          ]]]
        }
      },
      {
        type: "Feature",
        properties: {
          name: "Mendha",
          district: "Gadchiroli",
          state: "Maharashtra"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[[
            78.3234, 20.3234,
            78.3534, 20.3234,
            78.3534, 20.3534,
            78.3234, 20.3534,
            78.3234, 20.3234
          ]]]
        }
      }
    ]
  } as any;

  // Filter claims based on current filters
  const filteredFeatures = mapData?.features?.filter((feature: any) => {
    const props = feature.properties;
    
    // Status filter
    if (filters.status !== 'all' && props.status !== filters.status) {
      return false;
    }
    
    // State filter
    if (filters.state !== 'all' && props.state !== filters.state) {
      return false;
    }
    
    // District filter
    if (filters.district !== 'all' && props.district !== filters.district) {
      return false;
    }
    
    // Village filter
    if (filters.village !== 'all' && props.village !== filters.village) {
      return false;
    }
    
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesClaimId = props.claimId?.toLowerCase().includes(searchLower);
      const matchesClaimant = props.claimantName?.toLowerCase().includes(searchLower);
      const matchesVillage = props.village?.toLowerCase().includes(searchLower);
      
      if (!matchesClaimId && !matchesClaimant && !matchesVillage) {
        return false;
      }
    }
    
    return true;
  }) || [];

  // Get unique values for filter dropdowns
  const uniqueStates = Array.from(new Set(mapData?.features?.map((f: any) => f.properties.state).filter(Boolean))) || [];
  const uniqueDistricts = Array.from(new Set(mapData?.features?.map((f: any) => f.properties.district).filter(Boolean))) || [];
  const uniqueVillages = Array.from(new Set(mapData?.features?.map((f: any) => f.properties.village).filter(Boolean))) || [];

  // Custom marker icons for different statuses
  const createCustomIcon = (status: string, isCluster: boolean = false) => {
    const colors: Record<string, string> = {
      approved: '#10b981',
      rejected: '#ef4444', 
      review_required: '#f59e0b',
      pending: '#6b7280'
    };
    
    const size = isCluster ? 24 : 16;
    const borderSize = isCluster ? 3 : 2;
    
    return new L.DivIcon({
      html: `<div style="
        background-color: ${colors[status] || colors.pending}; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        border: ${borderSize}px solid white; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${isCluster ? '12px' : '8px'};
      ">${isCluster ? '' : ''}</div>`,
      className: 'custom-marker',
      iconSize: [size + borderSize * 2, size + borderSize * 2],
      iconAnchor: [(size + borderSize * 2) / 2, (size + borderSize * 2) / 2]
    });
  };

  const handleDrawCreated = (e: any) => {
    const { layer } = e;
    const geoJson = layer.toGeoJSON();
    setDrawnShapes(prev => [...prev, geoJson]);
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

  // Enhanced popup content for claims - XSS safe implementation
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties;
    const confidence = props.ocrConfidence ? `${props.ocrConfidence}%` : 'N/A';
    
    // Escape HTML to prevent XSS attacks
    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    const safeClaimId = escapeHtml(props.claimId || '');
    const safeClaimantName = escapeHtml(props.claimantName || '');
    const safeVillage = escapeHtml(props.village || '');
    const safeDistrict = escapeHtml(props.district || '');
    const safeState = escapeHtml(props.state || '');
    const safeArea = escapeHtml(String(props.area || '0'));
    const safeConfidence = escapeHtml(confidence);
    
    const getStatusClass = (status: string) => {
      switch (status) {
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'review_required': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    const popupContent = `
      <div class="p-3 min-w-[220px]">
        <h4 class="font-semibold text-sm mb-2 text-gray-900">${safeClaimId}</h4>
        <div class="space-y-1 text-xs">
          <p><span class="font-medium">Claimant:</span> ${safeClaimantName}</p>
          <p><span class="font-medium">Village:</span> ${safeVillage}</p>
          ${safeDistrict ? `<p><span class="font-medium">District:</span> ${safeDistrict}</p>` : ''}
          ${safeState ? `<p><span class="font-medium">State:</span> ${safeState}</p>` : ''}
          <p><span class="font-medium">Area:</span> ${safeArea} hectares</p>
          <p><span class="font-medium">OCR Confidence:</span> ${safeConfidence}</p>
        </div>
        <div class="mt-2">
          <span class="inline-block px-2 py-1 text-xs rounded ${getStatusClass(props.status)}">
            ${escapeHtml((props.status || 'pending').replace('_', ' ').toUpperCase())}
          </span>
        </div>
        <div class="mt-2 pt-2 border-t text-xs text-muted-foreground">
          Click claim boundary for more details
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Interactive Claims Map
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredFeatures.length} of {mapData?.features?.length || 0} claims visible
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant={showFilters ? "default" : "secondary"}
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-filters"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button 
              size="sm" 
              variant={showLayers ? "default" : "secondary"}
              onClick={() => setShowLayers(!showLayers)}
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

        {/* Search and Filter Controls */}
        {showFilters && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search claims..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="review_required">Review Required</SelectItem>
                </SelectContent>
              </Select>
              
              {/* State Filter */}
              <Select value={filters.state} onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* District Filter */}
              <Select value={filters.district} onValueChange={(value) => setFilters(prev => ({ ...prev, district: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {uniqueDistricts.map(district => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Village Filter */}
              <Select value={filters.village} onValueChange={(value) => setFilters(prev => ({ ...prev, village: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Village" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Villages</SelectItem>
                  {uniqueVillages.map(village => (
                    <SelectItem key={village} value={village}>{village}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Reset Filters */}
              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: 'all', state: 'all', district: 'all', village: 'all', searchTerm: '' })}
              >
                Reset
              </Button>
            </div>
          </div>
        )}
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
              <ZoomToFeaturesControl features={filteredFeatures} />
              
              {/* Render clustered markers for point locations */}
              <MarkerClusterGroup
                chunkedLoading
                showCoverageOnHover={false}
                maxClusterRadius={50}
                spiderfyOnMaxZoom={true}
                removeOutsideVisibleBounds={true}
              >
                {filteredFeatures
                  .filter((feature: any) => feature.geometry?.type === 'Point')
                  .map((feature: any, index: number) => {
                    const coords = feature.geometry.coordinates;
                    return (
                      <Marker
                        key={`marker-${feature.properties.id || index}`}
                        position={[coords[1], coords[0]]}
                        icon={createCustomIcon(feature.properties.status)}
                        eventHandlers={{
                          click: () => {
                            console.log('Marker clicked:', feature.properties);
                          }
                        }}
                      />
                    );
                  })
                }
              </MarkerClusterGroup>
              
              {/* Render claim boundaries */}
              {filteredFeatures.length > 0 && (
                <GeoJSON
                  key={JSON.stringify(filters)}
                  data={{ type: "FeatureCollection", features: filteredFeatures } as any}
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
                      edit: false,
                      remove: false,
                    }}
                  />
                </FeatureGroup>
              )}
            </MapContainer>
          )}
        </div>

        {/* Enhanced Map Legend */}
        <div className="p-4 border-t border-border">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Claims Legend</h4>
              <div className="text-sm text-muted-foreground">
                <span>{filteredFeatures.length} claims visible</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Approved ({filteredFeatures.filter((f: any) => f.properties.status === 'approved').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Pending ({filteredFeatures.filter((f: any) => f.properties.status === 'pending').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Review ({filteredFeatures.filter((f: any) => f.properties.status === 'review_required').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Rejected ({filteredFeatures.filter((f: any) => f.properties.status === 'rejected').length})</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>Total Area: {filteredFeatures.reduce((sum: number, f: any) => sum + (parseFloat(f.properties.area) || 0), 0).toFixed(2)} hectares</span>
              <span>Click markers/polygons for details</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}