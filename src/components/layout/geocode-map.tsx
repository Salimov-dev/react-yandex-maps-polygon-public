import { Circle, Map, Polygon } from "@pbe/react-yandex-maps";
import { useState } from "react";
import {
  Button,
  ColorPicker,
  Divider,
  Flex,
  Input,
  Modal,
  Typography
} from "antd";
import styled from "styled-components";
import { v4 } from "uuid";

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
  console.log("polygons", polygons);

  // Хэндлер для обработки клика по карте
  const handleClickMap = (e: IMapClickEvent) => {
    if (!isDrawing && !isEditing) {
      return;
    }

    const coords = e.get("coords");

    if (!coords) {
      return;
    }

    if (isDrawing) {
      setPolygonCoords((prev) => [...prev, coords]);
    } else if (isEditing) {
      insertPointOnPolygon(coords);
    }
  };

  // Хэндлер для сохранения нового полигона
  const handleSaveNewPolygon = () => {
    const newPolygon = {
      id: v4(),
      coords: polygonCoords,
      name: polygonName,
      color: polygonColor
    };

    setPolygons((prev) => [...prev, newPolygon]);
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
    setIsEditing(true);
  };
  const handleFinishEditing = () => {
    setIsEditing(false);
  };

  // Хэндлер для перемещения точек
  const handleDragPoint = (index: number, event: IDragEvent) => {
    const newCoords = event.get("target").geometry.getCoordinates();

    setPolygonCoords((prev) => {
      const updatedCoords = [...prev];
      updatedCoords[index] = newCoords;
      return [...updatedCoords];
    });
  };

  // ФУНКЦИИ ДЛЯ ДОБАВЛЕНИЯ НОВЫХ ТОЧЕК
  const insertPointOnPolygon = (clickCoords: CoordinatesType) => {
    let minDistance = Infinity;
    let insertIndex = -1;

    for (let i = 0; i < polygonCoords.length; i++) {
      const p1 = polygonCoords[i];
      const p2 = polygonCoords[(i + 1) % polygonCoords.length];
      const distance = pointToSegmentDistance(clickCoords, p1, p2);

      if (distance < minDistance) {
        minDistance = distance;
        insertIndex = i + 1;
      }
    }

    if (insertIndex !== -1) {
      setPolygonCoords((prev) => {
        const newCoords = [...prev];
        newCoords.splice(insertIndex, 0, clickCoords);
        return newCoords;
      });
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

  // Хэндел для очистки формы модального окна
  const handleClearModalData = () => {
    setPolygonName("");
    setPolygonColor(DEFAULT_POLYGON_COLOR);
  };

  // Хэндлеры для работы с модальным окном
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    handleClearModalData();
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    handleFinishDrawing();
    handleClearModalData();
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
              disabled={isEditing || isDrawing || !polygonCoords.length}
            >
              Начать редактирование
            </Button>
            <Button onClick={handleFinishEditing} disabled={!isEditing}>
              Завершить редактирование
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
          {polygonCoords.map((coord, index) => (
            <Circle
              key={index}
              geometry={[coord, isEditing ? 50 : 15]}
              options={{
                fillColor: "#000000",
                strokeColor: isEditing ? "#FF0000" : "#000000",
                strokeWidth: 3,
                draggable: isEditing
              }}
              onDrag={(e: IDragEvent) => handleDragPoint(index, e)}
            />
          ))}
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
