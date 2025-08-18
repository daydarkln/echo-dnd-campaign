import React from 'react';
import { 
  Card, 
  Typography, 
  Tag, 
  Divider, 
  Space, 
  Row, 
  Col,
  Button
} from 'antd';
import { 
  EnvironmentOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { PointOfInterest } from '../types';
import { LocationFieldVisibility } from '../types/visibility';
import LocationDetail from './LocationDetail';

const { Title, Text } = Typography;

interface PlayerLocationDetailProps {
  location: PointOfInterest;
  area: string;
  onBack: () => void;
  isModal?: boolean;
  fieldVisibility?: LocationFieldVisibility;
  getLocationFieldVisibility?: (locationId: string) => LocationFieldVisibility;
}

const PlayerLocationDetail: React.FC<PlayerLocationDetailProps> = ({ 
  location, 
  area, 
  onBack, 
  isModal = false,
  fieldVisibility,
  getLocationFieldVisibility
}) => {
  // Используем основной компонент LocationDetail с флагом isPlayerView
  return (
    <LocationDetail
      location={location}
      area={area}
      onBack={onBack}
      isModal={isModal}
      isPlayerView={true}
      fieldVisibility={fieldVisibility}
      getLocationFieldVisibility={getLocationFieldVisibility}
    />
  );
};

export default PlayerLocationDetail; 