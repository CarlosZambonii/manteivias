import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const openGoogleMaps = (lat, lon) => {
  if (lat && lon) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
  }
};

const RecordLocationMap = ({ record }) => {
  const worksitePosition = [record.obra.latitude, record.obra.longitude];
  const startPosition = record.lat_inicio ? [record.lat_inicio, record.lon_inicio] : null;
  const endPosition = record.lat_fim ? [record.lat_fim, record.lon_fim] : null;

  const bounds = [worksitePosition];
  if (startPosition) bounds.push(startPosition);
  if (endPosition) bounds.push(endPosition);

  return (
    <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }} className="rounded-lg">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <Marker 
        position={worksitePosition}
        eventHandlers={{ click: () => openGoogleMaps(record.obra.latitude, record.obra.longitude) }}
      >
        <Popup>
          <b>Obra: {record.obra.nome}</b><br/>
          Clique no pino para abrir no Google Maps.
        </Popup>
      </Marker>
      <Circle center={worksitePosition} radius={200} color="blue" fillColor="blue" fillOpacity={0.1} />

      {startPosition && (
        <Marker 
          position={startPosition}
          eventHandlers={{ click: () => openGoogleMaps(record.lat_inicio, record.lon_inicio) }}
        >
          <Popup>
            <b>Carimbo de Entrada</b><br />
            {new Date(record.hora_inicio_real).toLocaleString('pt-PT')}<br/>
            Clique no pino para abrir no Google Maps.
          </Popup>
        </Marker>
      )}

      {endPosition && (
        <Marker 
          position={endPosition}
          eventHandlers={{ click: () => openGoogleMaps(record.lat_fim, record.lon_fim) }}
        >
          <Popup>
            <b>Carimbo de Saída</b><br />
            {new Date(record.hora_fim_real).toLocaleString('pt-PT')}<br/>
            Clique no pino para abrir no Google Maps.
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default RecordLocationMap;