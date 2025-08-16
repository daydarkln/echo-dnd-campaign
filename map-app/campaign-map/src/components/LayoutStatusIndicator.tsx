import React from 'react';
import { Badge, Tooltip } from 'antd';
import { SaveOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface LayoutStatusIndicatorProps {
  isCustomLayout: boolean;
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
}

const LayoutStatusIndicator: React.FC<LayoutStatusIndicatorProps> = ({
  isCustomLayout,
  hasUnsavedChanges,
  isAutoSaving
}) => {
  if (!isCustomLayout) {
    return (
      <Tooltip title="Используется стандартная расстановка">
        <Badge 
          status="default" 
          text="Стандартная расстановка"
          style={{ fontSize: '12px' }}
        />
      </Tooltip>
    );
  }

  if (isAutoSaving) {
    return (
      <Tooltip title="Автоматическое сохранение...">
        <Badge 
          status="processing" 
          text="Сохранение..."
          style={{ fontSize: '12px' }}
        />
      </Tooltip>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <Tooltip title="Есть несохранённые изменения">
        <Badge 
          status="warning" 
          text="Несохранённые изменения"
          style={{ fontSize: '12px' }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Расстановка сохранена">
      <Badge 
        status="success" 
        text="Сохранено"
        style={{ fontSize: '12px' }}
      />
    </Tooltip>
  );
};

export default LayoutStatusIndicator; 