import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Space,
  Popconfirm,
  Typography,
  Empty,
  Tag,
  message
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { Spell, createSpell } from '../types/character';

const { Text } = Typography;

interface SpellLevelManagerProps {
  title: string;
  spells: Spell[];
  onAddSpell: (spell: Spell) => void;
  onRemoveSpell: (spellId: string) => void;
  size?: 'default' | 'small';
  maxHeight?: number;
}

export const SpellLevelManager: React.FC<SpellLevelManagerProps> = ({
  title,
  spells,
  onAddSpell,
  onRemoveSpell,
  size = 'default',
  maxHeight = 300
}) => {
  const [spellName, setSpellName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSpell = () => {
    if (!spellName.trim()) {
      message.warning('Введите название заклинания');
      return;
    }

    // Проверяем, нет ли уже такого заклинания
    const existingSpell = spells.find(
      spell => spell.name.toLowerCase() === spellName.trim().toLowerCase()
    );

    if (existingSpell) {
      message.warning('Такое заклинание уже добавлено');
      return;
    }

    const newSpell = createSpell(spellName);
    onAddSpell(newSpell);
    setSpellName('');
    setIsAdding(false);
    message.success(`Заклинание "${newSpell.name}" добавлено`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSpell();
    } else if (e.key === 'Escape') {
      setSpellName('');
      setIsAdding(false);
    }
  };

  const handleRemoveSpell = (spell: Spell) => {
    onRemoveSpell(spell.id);
    message.success(`Заклинание "${spell.name}" удалено`);
  };

  const openSpellReference = (spell: Spell) => {
    window.open(spell.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card 
      title={
        <Space>
          <span>{title}</span>
          {spells.length > 0 && (
            <Tag color="blue" style={{ fontSize: '10px' }}>
              {spells.length}
            </Tag>
          )}
        </Space>
      } 
      
      style={{ marginBottom: size === 'small' ? 12 : 16 }}
      extra={
        !isAdding && (
          <Button
            
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setIsAdding(true)}
          >
            Добавить
          </Button>
        )
      }
    >
      {/* Поле добавления заклинания */}
      {isAdding && (
        <div style={{ marginBottom: 12 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Введите название заклинания..."
              value={spellName}
              onChange={(e) => setSpellName(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddSpell}
              
            >
              Добавить
            </Button>
            <Button
              onClick={() => {
                setSpellName('');
                setIsAdding(false);
              }}
              
            >
              Отмена
            </Button>
          </Space.Compact>
        </div>
      )}

      {/* Список заклинаний */}
      {spells.length === 0 ? (
        <Empty
          description="Нет заклинаний"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '20px 0' }}
        />
      ) : (
        <div 
          style={{ 
            maxHeight: maxHeight, 
            overflowY: 'auto',
            ...(size === 'small' && { fontSize: '12px' })
          }}
        >
          <List
            
            dataSource={spells}
            renderItem={(spell) => (
              <List.Item
                actions={[
                  <Button
                    key="reference"
                    type="link"
                    
                    icon={<LinkOutlined />}
                    onClick={() => openSpellReference(spell)}
                    title="Открыть справочник"
                    style={{ padding: 0, height: 'auto' }}
                  />,
                  <Popconfirm
                    key="delete"
                    title="Удалить заклинание?"
                    description={`Удалить "${spell.name}" из списка?`}
                    onConfirm={() => handleRemoveSpell(spell)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <Button
                      type="link"
                      
                      danger
                      icon={<DeleteOutlined />}
                      style={{ padding: 0, height: 'auto' }}
                    />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Text 
                      strong 
                      style={{ 
                        fontSize: size === 'small' ? '12px' : '14px',
                        cursor: 'pointer'
                      }}
                      onClick={() => openSpellReference(spell)}
                    >
                      {spell.name}
                    </Text>
                  }
                  description={
                    <Text 
                      type="secondary" 
                      style={{ fontSize: size === 'small' ? '10px' : '12px' }}
                    >
                      Нажмите для открытия справочника
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </Card>
  );
};