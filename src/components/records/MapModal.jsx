import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';

const MapModal = ({ isOpen, onClose, record }) => {
  if (!record) return null;

  const worksitePosition = [record.obra.latitude, record.obra.longitude];
  const startPosition = record.lat_inicio ? [record.lat_inicio, record.lon_inicio] : null;
  const endPosition = record.lat_fim ? [record.lat_fim, record.lon_fim] : null;

  const centerPosition = startPosition || worksitePosition;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Localização do Registo</DialogTitle>
          <DialogDescription>
            Visualização do local da obra e dos pontos de registo do colaborador {record.usuario.nome}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow mt-4">
          <MapContainer center={centerPosition} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Marker position={worksitePosition}>
              <Popup>Local da Obra: {record.obra.nome}</Popup>
            </Marker>
            <Circle center={worksitePosition} radius={200} color="blue" fillColor="blue" fillOpacity={0.1} />

            {startPosition && (
              <Marker position={startPosition}>
                <Popup>Ponto de Entrada</Popup>
              </Marker>
            )}

            {endPosition && (
              <Marker position={endPosition}>
                <Popup>Ponto de Saída</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        <div className="flex justify-around mt-4 p-2 bg-muted rounded-lg">
            <Badge variant="default">Obra</Badge>
            <Badge variant="success">Entrada</Badge>
            <Badge variant="destructive">Saída</Badge>
            <Badge variant="secondary">Raio de 200m</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapModal;