import { Map, Placemark, Polygon, useYMaps } from "@pbe/react-yandex-maps";
import { useState } from "react";
import { Divider, Flex, Typography } from "antd";
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

const AddressWithCoordinates = styled(Flex)`
  flex-direction: column;
`;

const InfoWithPanoramaWrapper = styled(Flex)`
  width: 100%;
  height: 100%;
`;

const EmptyAddressMessage = styled(Typography.Title)`
  width: 100%;
  text-align: center;
`;

const CENTER = [59.94077030138753, 30.31197058944388];
const ZOOM = 12;

const GeocodeMap = () => {
  // const [coordinates, setCoordinates] = useState<CoordinatesType | null>(null);
  // const [address, setAddress] = useState<IAddress | null>(null);

  const ymaps = useYMaps(["geocode"]);

  // const formattedCoordinates = coordinates
  //   ? `${coordinates[0]?.toFixed(6)}, ${coordinates[1]?.toFixed(6)}`
  //   : null;

  const handleClickMap = (e: IMapClickEvent) => {
    const coords = e.get("coords");

    // if (coords) {
    //   setCoordinates(coords);
    // }

    // ymaps
    //   ?.geocode(coords)
    //   .then((result) => {
    //     const foundAddress = handleGeoResult(result);

    //     if (foundAddress) setAddress(foundAddress);
    //   })
    //   .catch((error: unknown) => {
    //     console.log("Ошибка геокодирования", error);
    //     setAddress(null);
    //   });
  };

  // function handleGeoResult(result: IGeocodeResult) {
  //   const firstGeoObject = result.geoObjects.get(0);

  //   if (firstGeoObject) {
  //     const properties = firstGeoObject.properties;

  //     const location = String(properties.get("description", {}));
  //     const route = String(properties.get("name", {}));

  //     const foundAddress = {
  //       location,
  //       route
  //     };

  //     return foundAddress;
  //   }
  // }

  return (
    <CardWithGeocodeMap>
      <CardWithMapWrapper>
        <LocationInfoCard>
          {/* {address ? (
            <InfoWithPanoramaWrapper vertical>
              <AddressWithCoordinates>
                <Typography.Text>{`Локация: ${address?.location}`}</Typography.Text>
                <Typography.Text> {`Адрес: ${address?.route}`}</Typography.Text>
                <Typography.Text>
                  {`Координаты: ${formattedCoordinates}`}
                </Typography.Text>
              </AddressWithCoordinates>
            </InfoWithPanoramaWrapper>
          ) : (
            <EmptyAddressMessage>Выберите точку на карте</EmptyAddressMessage>
          )} */}
          <Typography.Text>
            Здесь будет информация о координатах метки
          </Typography.Text>
          <Divider />
        </LocationInfoCard>

        <MapWithGeocode
          defaultState={{
            center: CENTER,
            zoom: ZOOM
          }}
          onClick={(e: IMapClickEvent) => handleClickMap(e)}
        >
          {/* {coordinates && <Placemark geometry={coordinates} />} */}

          {/* <Polygon
            geometry={[
              [
                [55.75, 37.8],
                [55.8, 37.9],
                [55.75, 38.0],
                [55.7, 38.0],
                [55.7, 37.8]
              ]
            ]}
            options={{
              fillColor: "#00FF00",
              strokeColor: "#0000FF",
              opacity: 0.5,
              strokeWidth: 5,
              strokeStyle: "shortdash"
            }}
          /> */}
        </MapWithGeocode>
      </CardWithMapWrapper>
    </CardWithGeocodeMap>
  );
};
