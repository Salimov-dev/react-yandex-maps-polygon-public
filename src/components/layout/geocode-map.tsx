import {
  Circle,
  Map,
  Placemark,
  Polygon,
  useYMaps
} from "@pbe/react-yandex-maps";
import { useState } from "react";
import { v4 } from "uuid";
import {
  Button,
  ColorPicker,
  Divider,
  Flex,
  Input,
  Modal,
  Select,
  Typography
} from "antd";
import styled from "styled-components";
import { IGeocodeResult } from "yandex-maps";

type CoordinatesType = Array<number>;

interface IMapClickEvent {
  get: (key: string) => CoordinatesType;
}

interface IGeometry {
  getCoordinates: () => CoordinatesType;
}

interface IPlacemark {
  geometry: IGeometry;
}

interface IDragEvent {
  get: (key: string) => IPlacemark;
}

interface IPolygons {
  id: string;
  coords: CoordinatesType[];
  name: string;
  color: string;
}

interface IAddress {
  location: string;
  route: string;
}

const AddressWithCoordinates = styled(Flex)`
  flex-direction: column;
`;

const InfoWithPanoramaWrapper = styled(Flex)`
  width: 100%;
  height: 100px;
`;

const EmptyAddressMessage = styled(Typography.Title)`
  width: 100%;
  text-align: center;
`;

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
const DEFAULT_POLYGON_COLOR = "#32CD32";

const GeocodeMap = () => {
  const [polygonCoords, setPolygonCoords] = useState<CoordinatesType[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [polygonName, setPolygonName] = useState("");
  const [polygonColor, setPolygonColor] = useState(DEFAULT_POLYGON_COLOR);
  const [polygons, setPolygons] = useState<IPolygons[]>([]);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(
    null
  );
  const [markerCoords, setMarkerCoords] = useState<CoordinatesType | null>(
    null
  );
  const [address, setAddress] = useState<IAddress | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string>("");

  const ymaps = useYMaps(["geocode"]);

  const formattedCoordinates = markerCoords
    ? `${markerCoords[0]?.toFixed(6)}, ${markerCoords[1]?.toFixed(6)}`
    : null;

  const selectedPolygon = polygons.find(
    (poly) => poly.id === selectedPolygonId
  );

  // Хэндлер для обработки клика по карте
  const handleClickMap = (e: IMapClickEvent) => {
    const coords = e.get("coords");

    if (!coords) {
      return;
    }

    if (isDrawing) {
      setPolygonCoords((prev) => [...prev, coords]);
    } else if (isEditing && selectedPolygonId) {
      insertPointOnPolygon(coords);
    } else {
      setMarkerCoords(coords);
      getAddressByCoords(coords);

      const polygonContainingMarker = polygons.find((poly) =>
        isPointInPolygon(coords, poly.coords)
      );

      if (polygonContainingMarker) {
        setDeliveryStatus(
          `Входит в зону доставки: ${polygonContainingMarker.name}`
        );
      } else {
        setDeliveryStatus("Вне зоны доставки");
      }
    }
  };

  // Функция проверяет вхождение метки в границы полигона
  const isPointInPolygon = (point, polygon) => {
    const x = point[0];
    const y = point[1];
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Функция определения адреса
  function getAddressByCoords(coords: CoordinatesType) {
    if (!ymaps) {
      return "Адрес не найден";
    }

    ymaps
      ?.geocode(coords)
      .then((result) => {
        const foundAddress = handleGeoResult(result);

        if (foundAddress) setAddress(foundAddress);
      })
      .catch((error: unknown) => {
        console.log("Ошибка геокодирования", error);
        setAddress(null);
      });
  }

  // Функция обработки геокодирования
  function handleGeoResult(result: IGeocodeResult) {
    const firstGeoObject = result.geoObjects.get(0);

    if (firstGeoObject) {
      const properties = firstGeoObject.properties;

      const location = String(properties.get("description", {}));
      const route = String(properties.get("name", {}));

      const foundAddress = {
        location,
        route
      };

      return foundAddress;
    }
  }

  // Хэндлер для сохранения нового полигона
  const handleSaveNewPolygon = () => {
    const newPolygon = {
      id: v4(),
      coords: polygonCoords,
      name: polygonName,
      color: polygonColor
    };

    setPolygons((prev) => [...prev, newPolygon]);
    setPolygonCoords([]);
  };

  // Хэндлеры для создания полигона
  const handleStartDrawing = () => {
    setPolygonCoords([]);
    setIsDrawing(true);
  };
  const handleFinishDrawing = () => {
    setIsDrawing(false);
    handleSaveNewPolygon();
  };

  // Хэндлеры для редактирования полигона
  const handleStartEditing = () => {
    if (selectedPolygonId) {
      setIsEditing(true);
    }
  };
  const handleFinishEditing = () => {
    setIsEditing(false);
  };

  // Хэндлер для перемещения точек
  const handleDragPoint = (index: number, event: IDragEvent) => {
    if (!isEditing || !selectedPolygonId) {
      return;
    }

    const newCoords = event.get("target").geometry.getCoordinates();

    setPolygons((prev) =>
      prev.map((poly) =>
        poly.id === selectedPolygonId
          ? {
              ...poly,
              coords: poly.coords.map((coord, i) =>
                i === index ? newCoords : coord
              )
            }
          : poly
      )
    );
  };

  // ФУНКЦИИ ДЛЯ ДОБАВЛЕНИЯ НОВЫХ ТОЧЕК
  const insertPointOnPolygon = (clickCoords: CoordinatesType) => {
    if (!selectedPolygonId || !selectedPolygon) {
      return;
    }

    let minDistance = Infinity;
    let insertIndex = -1;

    for (let i = 0; i < selectedPolygon?.coords.length; i++) {
      const p1 = selectedPolygon?.coords[i];
      const p2 =
        selectedPolygon?.coords[(i + 1) % selectedPolygon?.coords.length];
      const distance = pointToSegmentDistance(clickCoords, p1, p2);

      if (distance < minDistance) {
        minDistance = distance;
        insertIndex = i + 1;
      }
    }

    if (insertIndex !== -1) {
      setPolygons((prev) =>
        prev.map((poly) =>
          poly.id === selectedPolygonId
            ? {
                ...poly,
                coords: [
                  ...poly.coords.slice(0, insertIndex),
                  clickCoords,
                  ...poly.coords.slice(insertIndex)
                ]
              }
            : poly
        )
      );
    }
  };

  const pointToSegmentDistance = (
    point: CoordinatesType,
    segmentStart: CoordinatesType,
    segmentEnd: CoordinatesType
  ) => {
    const A = point[0] - segmentStart[0];
    const B = point[1] - segmentStart[1];

    const C = segmentEnd[0] - segmentStart[0];
    const D = segmentEnd[1] - segmentStart[1];

    const dot = A * C + B * D;
    const lenSquare = C * C + D * D;
    let param = -1;

    if (lenSquare !== 0) {
      param = dot / lenSquare;
    }

    let xx, yy;

    if (param < 0) {
      xx = segmentStart[0];
      yy = segmentStart[1];
    } else if (param > 1) {
      xx = segmentEnd[0];
      yy = segmentEnd[1];
    } else {
      xx = segmentStart[0] + param * C;
      yy = segmentStart[1] + param * D;
    }

    const dx = point[0] - xx;
    const dy = point[1] - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Хэндлер для очистки формы модального окна
  const handleClearModalData = () => {
    setPolygonName("");
    setPolygonColor(DEFAULT_POLYGON_COLOR);
  };

  // Хэндлеры для работы с модальным окном
  const showModal = () => {
    setIsModalOpen(true);
    handleClearModalData();
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancelModal = () => {
    setIsModalOpen(false);
    handleFinishDrawing();
  };

  // Хэндлер для выбора полигона
  const handleSelectPolygon = (id: string) => {
    setSelectedPolygonId(id);
  };

  return (
    <CardWithGeocodeMap>
      <CardWithMapWrapper>
        <LocationInfoCard>
          {address ? (
            <InfoWithPanoramaWrapper vertical>
              <AddressWithCoordinates>
                <Typography.Text>{`Локация: ${address?.location}`}</Typography.Text>
                <Typography.Text> {`Адрес: ${address?.route}`}</Typography.Text>
                <Typography.Text>
                  {`Координаты: ${formattedCoordinates}`}
                </Typography.Text>
                <Typography.Text>{deliveryStatus}</Typography.Text>
              </AddressWithCoordinates>
            </InfoWithPanoramaWrapper>
          ) : (
            <EmptyAddressMessage>Выберите точку на карте</EmptyAddressMessage>
          )}
          <Divider />
          <ControlButtons>
            <Button
              onClick={() => {
                handleStartDrawing();
                showModal();
              }}
              disabled={isDrawing || isEditing}
            >
              Начать рисование
            </Button>
            <Button onClick={handleFinishDrawing} disabled={!isDrawing}>
              Завершить рисование
            </Button>
            <Divider />
            <Button
              onClick={handleStartEditing}
              disabled={isEditing || isDrawing || !selectedPolygonId}
            >
              Начать редактирование
            </Button>
            <Button onClick={handleFinishEditing} disabled={!isEditing}>
              Завершить редактирование
            </Button>
            <Divider />
            <Select
              placeholder="Выберите полигон"
              onChange={(id) => handleSelectPolygon(id)}
              options={polygons.map((poly) => ({
                value: poly.id,
                label: poly.name
              }))}
            />
          </ControlButtons>
        </LocationInfoCard>

        <MapWithGeocode
          defaultState={{
            center: CENTER,
            zoom: ZOOM
          }}
          onClick={(e: IMapClickEvent) => handleClickMap(e)}
        >
          {isDrawing && polygonCoords.length > 0 && (
            <Polygon
              geometry={[polygonCoords]}
              options={{
                fillColor: polygonColor,
                strokeColor: "#0000FF",
                opacity: 0.5,
                strokeWidth: 5,
                strokeStyle: "shortdash"
              }}
            />
          )}

          {polygons.map((poly) => {
            return (
              <Polygon
                key={poly.id}
                geometry={[poly.coords]}
                options={{
                  fillColor: poly.color,
                  strokeColor:
                    poly.id === selectedPolygonId && isEditing
                      ? "#FF0000"
                      : "#0000FF",
                  opacity: 0.5,
                  strokeWidth: 5,
                  strokeStyle: "shortdash",
                  interactivityModel: "default#transparent"
                }}
              />
            );
          })}

          {isDrawing &&
            polygonCoords.map((coord, index) => (
              <Circle
                key={index}
                geometry={[coord, 15]}
                options={{
                  fillColor: "#000000",
                  strokeColor: "#000000",
                  strokeWidth: 3,
                  draggable: false
                }}
              />
            ))}

          {isEditing &&
            selectedPolygon?.coords.map((coord, index) => (
              <Circle
                key={index}
                geometry={[coord, 50]}
                options={{
                  fillColor: "#0000FF",
                  strokeColor: "#FF0000",
                  strokeWidth: 3,
                  draggable: true
                }}
                onDrag={(e: IDragEvent) => handleDragPoint(index, e)}
              />
            ))}

          {markerCoords && <Placemark geometry={markerCoords} />}
        </MapWithGeocode>
      </CardWithMapWrapper>

      <Modal
        title="Задайте имя и цвет полигона"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancelModal}
      >
        <Input
          placeholder="Имя полигона"
          value={polygonName}
          onChange={(e) => setPolygonName(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
        <ColorPicker
          value={polygonColor}
          onChange={(e) => setPolygonColor(e.toHexString())}
        />
      </Modal>
    </CardWithGeocodeMap>
  );
};

export default GeocodeMap;
