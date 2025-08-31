import React from 'react';
import { Card, Typography, Space, Row, Col, Divider } from 'antd';
import { 
  PlayCircleOutlined, 
  TeamOutlined, 
  CompassOutlined, 
  BookOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export const GameModeView: React.FC = () => {
  // Обработчики кликов для карточек
  const handleLocationClick = () => {
    console.log('Клик по карточке локации');
    // Здесь можно добавить навигацию к деталям локации
  };

  const handleGroupClick = () => {
    console.log('Клик по карточке группы');
    // Здесь можно добавить навигацию к управлению группой
  };

  const handleQuestsClick = () => {
    console.log('Клик по карточке квестов');
    // Здесь можно добавить навигацию к странице квестов
  };

  const handleActionsClick = () => {
    console.log('Клик по карточке быстрых действий');
    // Здесь можно добавить навигацию к инструментам мастера
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={2} style={{ color: '#52c41a' }}>
          <PlayCircleOutlined style={{ marginRight: '12px' }} />
          Режим игры
        </Title>
        <Text type="secondary">
          Упрощенный интерфейс для игрового процесса
        </Text>
      </div>

      {/* Основные секции */}
      <Row gutter={[24, 24]}>
        {/* Текущая локация */}
        <Col xs={24} md={12}>
          <Card 
            hoverable
            onClick={handleLocationClick}
            className="game-mode-card"
            style={{ height: '100%' }}
          >
            <CompassOutlined style={{ 
              fontSize: '32px', 
              color: '#1890ff', 
              marginBottom: '16px' 
            }} />
            <Title level={4} style={{ marginBottom: '8px', color: '#1890ff' }}>
              Текущая локация
            </Title>
            <Text style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '8px'
            }}>
              Городское кладбище
            </Text>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Тип: dungeon • Время: отключено • Погода: активна
            </Text>
          </Card>
        </Col>

        {/* Группа игроков */}
        <Col xs={24} md={12}>
          <Card 
            hoverable
            onClick={handleGroupClick}
            className="game-mode-card"
            style={{ height: '100%' }}
          >
            <TeamOutlined style={{ 
              fontSize: '32px', 
              color: '#722ed1', 
              marginBottom: '16px' 
            }} />
            <Title level={4} style={{ marginBottom: '8px', color: '#722ed1' }}>
              Группа игроков
            </Title>
            <Text style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '8px'
            }}>
              4 персонажа
            </Text>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Уровень: 3-4 • Здоровье: 85%
            </Text>
          </Card>
        </Col>

        {/* Активные квесты */}
        <Col xs={24} md={12}>
          <Card 
            hoverable
            onClick={handleQuestsClick}
            className="game-mode-card"
            style={{ height: '100%' }}
          >
            <BookOutlined style={{ 
              fontSize: '32px', 
              color: '#fa8c16', 
              marginBottom: '16px' 
            }} />
            <Title level={4} style={{ marginBottom: '8px', color: '#fa8c16' }}>
              Активные квесты
            </Title>
            <Text style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '8px'
            }}>
              2 активных квеста
            </Text>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Основной: Лунные нити памяти
            </Text>
          </Card>
        </Col>

        {/* Быстрые действия */}
        <Col xs={24} md={12}>
          <Card 
            hoverable
            onClick={handleActionsClick}
            className="game-mode-card"
            style={{ height: '100%' }}
          >
            <ThunderboltOutlined style={{ 
              fontSize: '32px', 
              color: '#eb2f96', 
              marginBottom: '16px' 
            }} />
            <Title level={4} style={{ marginBottom: '8px', color: '#eb2f96' }}>
              Быстрые действия
            </Title>
            <Text style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '8px'
            }}>
              Инструменты мастера
            </Text>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Часто используемые функции
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Информационная панель */}
      <Card 
        style={{ marginTop: '24px' }}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#13c2c2' }} />
            Информация о режиме игры
          </Space>
        }
      >
        <Paragraph>
          <Text strong>Режим игры</Text> - это упрощенный интерфейс, специально разработанный для использования во время игровых сессий.
        </Paragraph>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <CompassOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
              <div><Text strong>Быстрый доступ</Text></div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                К важной информации о локациях, персонажах и квестах
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <TeamOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
              <div><Text strong>Управление группой</Text></div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Отслеживание здоровья, инициативы и состояния персонажей
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <BookOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: '8px' }} />
              <div><Text strong>Квесты и прогресс</Text></div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Мониторинг активных заданий и достижений игроков
              </Text>
            </div>
          </Col>
        </Row>
        <Divider />
        <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
          💡 Это базовая версия режима игры. Функциональность будет расширяться в зависимости от потребностей.
        </Text>
      </Card>
    </div>
  );
};

export default GameModeView;
