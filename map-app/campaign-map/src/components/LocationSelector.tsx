import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  Tabs,
  List,
  Button,
  Radio,
  Checkbox,
  Avatar,
  Tag,
  Space,
  Typography,
  Empty,
  Collapse,
  Input
} from 'antd';
import {
  EnvironmentOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useDataSource } from '../hooks/useDataSource';
import { PointOfInterest, Area } from '../types';

const { Text } = Typography;
const { Panel } = Collapse;
const { Search } = Input;

interface LocationSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation?: (location: { id: string; name: string; area: string }) => void;
  onSelectMultipleLocations?: (locations: { id: string; name: string; area: string }[]) => void;
  title?: string;
  allowMultipleSelection?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  visible,
  onClose,
  onSelectLocation,
  onSelectMultipleLocations,
  title = "Добавить локации в квест",
  allowMultipleSelection = false
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
  const initializedOnOpenRef = useRef(false);

  const { pointsData, loading } = useDataSource();

  // Сбрасываем выбор при открытии модалки
  useEffect(() => {
    if (visible) {
      setSelectedLocationId(null);
      setSelectedLocationIds([]);
      setSearchTerm('');
      setExpandedRegions([]);
      initializedOnOpenRef.current = false;
    }
  }, [visible]);

  // Отдельный эффект для установки развернутого региона
  useEffect(() => {
    if (visible && pointsData?.areas.length && expandedRegions.length === 0) {
      setExpandedRegions([pointsData.areas[0].area]);
      initializedOnOpenRef.current = true;
    }
  }, [visible, pointsData?.areas.length, expandedRegions.length]);

  const handleClose = () => {
    setSelectedLocationId(null);
    setSelectedLocationIds([]);
    setSearchTerm('');
    setExpandedRegions([]);
    onClose();
  };

  const handleSelectLocation = () => {
    if (allowMultipleSelection) {
      if (selectedLocationIds.length === 0) {
        return;
      }
      
      const selectedLocations = getSelectedLocations();
      if (onSelectMultipleLocations) {
        onSelectMultipleLocations(selectedLocations);
      }
    } else {
      const location = findLocationById(selectedLocationId);
      if (location && onSelectLocation) {
        onSelectLocation({
          id: location.id,
          name: location.name,
          area: location.area
        });
      }
    }
    handleClose();
  };

  const handleToggleLocationSelection = (locationId: string) => {
    if (allowMultipleSelection) {
      setSelectedLocationIds(prev => 
        prev.includes(locationId) 
          ? prev.filter(id => id !== locationId)
          : [...prev, locationId]
      );
    } else {
      setSelectedLocationId(locationId);
    }
  };

  const findLocationById = useCallback((locationId: string | null) => {
    if (!locationId || !pointsData) return null;
    
    for (const area of pointsData.areas) {
      const location = area.pointsOfInterest.find(poi => poi.id === locationId);
      if (location) {
        return { ...location, area: area.area };
      }
    }
    return null;
  }, [pointsData]);

  const getSelectedLocations = useCallback(() => {
    if (!pointsData) return [];
    
    const locations: { id: string; name: string; area: string }[] = [];
    
    for (const area of pointsData.areas) {
      for (const poi of area.pointsOfInterest) {
        if (selectedLocationIds.includes(poi.id)) {
          locations.push({
            id: poi.id,
            name: poi.name,
            area: area.area
          });
        }
      }
    }
    
    return locations;
  }, [pointsData, selectedLocationIds]);

  const filterLocations = useCallback((locations: PointOfInterest[], searchTerm: string) => {
    if (!searchTerm) return locations;
    
    const term = searchTerm.toLowerCase();
    return locations.filter(location => 
      location.name.toLowerCase().includes(term) ||
      location.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }, []);

  const filteredAreas = useMemo(() => {
    if (!pointsData) return [];
    
    return pointsData.areas.filter(area => {
      const filteredLocations = filterLocations(area.pointsOfInterest, searchTerm);
      return filteredLocations.length > 0;
    }).map(area => ({
      ...area,
      pointsOfInterest: filterLocations(area.pointsOfInterest, searchTerm)
    }));
  }, [pointsData, searchTerm, filterLocations]);

  if (loading || !pointsData) {
    return (
      <Modal
        title={title}
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={800}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Загрузка локаций...
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Отмена
        </Button>,
        <Button 
          key="select" 
          type="primary" 
          onClick={handleSelectLocation}
          disabled={allowMultipleSelection ? selectedLocationIds.length === 0 : !selectedLocationId}
        >
          {allowMultipleSelection 
            ? `Добавить ${selectedLocationIds.length > 0 ? selectedLocationIds.length + ' ' : ''}в квест`
            : 'Добавить в квест'
          }
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Search
          placeholder="Поиск по названию или тегам локации"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
          prefix={<SearchOutlined />}
        />

        {allowMultipleSelection && (
          <Text type="secondary">
            Выбрано: {selectedLocationIds.length} локаций
          </Text>
        )}

        <Collapse
          activeKey={expandedRegions}
          onChange={(keys) => setExpandedRegions(keys as string[])}
          style={{ maxHeight: '500px', overflow: 'auto' }}
        >
          {filteredAreas.map((area) => (
              <Panel 
                key={area.area} 
                header={
                  <Space>
                    <EnvironmentOutlined />
                    <Text strong>{area.area}</Text>
                    <Tag color="blue">
                      {area.pointsOfInterest.length} локаций
                    </Tag>
                  </Space>
                }
              >
                <List
                  
                  dataSource={area.pointsOfInterest}
                  renderItem={(location) => (
                    <List.Item
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: (allowMultipleSelection ? selectedLocationIds.includes(location.id) : selectedLocationId === location.id) 
                          ? '#e6f7ff' 
                          : 'transparent'
                      }}
                      onClick={() => handleToggleLocationSelection(location.id)}
                    >
                      <List.Item.Meta
                        avatar={
                          allowMultipleSelection ? (
                            <Checkbox
                              checked={selectedLocationIds.includes(location.id)}
                              onChange={() => handleToggleLocationSelection(location.id)}
                            >
                              <Avatar 
                                style={{ backgroundColor: '#52c41a' }}
                                icon={<EnvironmentOutlined />}
                              />
                            </Checkbox>
                          ) : (
                            <Radio
                              checked={selectedLocationId === location.id}
                              onChange={() => handleToggleLocationSelection(location.id)}
                            >
                              <Avatar 
                                style={{ backgroundColor: '#52c41a' }}
                                icon={<EnvironmentOutlined />}
                              />
                            </Radio>
                          )
                        }
                        title={
                          <Space direction="vertical" size={0}>
                            <Text strong>{location.name}</Text>
                            <Space size={0} wrap>
                              {location.tags.map(tag => (
                                <Tag key={tag} style={{ fontSize: '11px' }}>{tag}</Tag>
                              ))}
                            </Space>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">Регион: {area.area}</Text>
                            <Text type="secondary">
                              {location.encounters.length} энкаунтеров, {location.loot.length} предметов, {location.clues.length} улик
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Panel>
            ))}
        </Collapse>

        {filteredAreas.length === 0 && (
          <Empty 
            description="Нет локаций, соответствующих поиску"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Space>
    </Modal>
  );
};
