import { Map, Placemark, Polygon, useYMaps } from "@pbe/react-yandex-maps";
import { useState } from "react";
import { Button, Divider, Flex, Typography } from "antd";
import styled from "styled-components";
import { IGeocodeResult } from "yandex-maps";

type CoordinatesType = Array<number>;

interface IMapClickEvent {
  get: (key: string) => CoordinatesType;
}

interface IAddress {
  location: string;
  route: string;
}

const CardWithGeocodeMap = styled(Flex)`
  width: 100%;
  flex-direction: column;
`;

const CardWithMapWrapper = styled(Flex)`
  height: 700px;
  gap: 6px;
`;

const MapWithGeocode = styled(Map)`
  width: 75%;
  border: 1px solid black;
  border-radius: 10px;
  overflow: hidden;
`;

const LocationInfoCard = styled(Flex)`
  width: 25%;
  flex-direction: column; // удалить позже
  justify-content: flex-start; // поменять на center
  align-items: center;
  border: 1px solid black;
  border-radius: 10px;
  padding: 6px;
`;

const ControlButtons = styled(Flex)`
  height: 100%;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
`;

const CENTER = [59.94077030138753, 30.31197058944388];
const ZOOM = 12;

const GeocodeMap = () => {
  const [polygonCoords, setPolygonCoords] = useState<CoordinatesType[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const ymaps = useYMaps(["geocode"]);

  const handleClickMap = (e: IMapClickEvent) => {
    if (!isDrawing) {
      return;
    }

    const coords = e.get("coords");

    if (!coords) {
      return;
    }

    setPolygonCoords((prev) => [...prev, coords]);
  };

  const handleStartDrawing = () => {
    setPolygonCoords([]);
    setIsDrawing(true);
  };

  const handleFinishDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <CardWithGeocodeMap>
      <CardWithMapWrapper>
        <LocationInfoCard>
          <Typography.Text>
            Здесь будет информация о координатах метки
          </Typography.Text>
          <Divider />
          <ControlButtons>
            <Button onClick={handleStartDrawing} disabled={isDrawing}>
              Начать рисование
            </Button>
            <Button onClick={handleFinishDrawing} disabled={!isDrawing}>
              Завершить рисование
            </Button>
          </ControlButtons>
        </LocationInfoCard>

        <MapWithGeocode
          defaultState={{
            center: CENTER,
            zoom: ZOOM
          }}
          onClick={(e: IMapClickEvent) => handleClickMap(e)}
        >
          {polygonCoords.length > 0 && (
            <Polygon
              geometry={[polygonCoords]}
              options={{
                fillColor: "#00FF00",
                strokeColor: "#0000FF",
                opacity: 0.5,
                strokeWidth: 5,
                strokeStyle: "shortdash"
              }}
            />
          )}
        </MapWithGeocode>
      </CardWithMapWrapper>
    </CardWithGeocodeMap>
  );
};

export default GeocodeMap;
