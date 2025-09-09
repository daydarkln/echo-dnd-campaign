import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button, Col, Divider, Empty, Layout, List, Modal, Row, Space, Spin, Tag, Typography, message, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuests } from '../hooks/useQuests';
import QuestEditor from '../components/QuestEditor';

import { CreateQuestInput, Quest } from '../types/quests';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Content } = Layout;
const { Title } = Typography;

function createSeedQuest(): CreateQuestInput {
  const md = `
## Побочный квест: «Лунные нити памяти»

**Завязка:** По ночам на городском кладбище видны бледно‑бирюзовые огни; шепчутся, будто «трупы светятся», а мицелий плетёт замысел.

### Ключевые NPC
- **Дария Корос**, смотрительница кладбища; скрывает, что слышит «тихий звон» из‑под склепов.
- **Брат Фалько**, жрец. _Твист:_ уже мёртв; голос поддержан грибницей как эхо.
- **Лисандр Мори**, фактор гильдии; подсыпает фосфорные соли, чтобы раздуть панику.
- **«Светошёпот»**, разум мицелия; ткет световой барьер из памяти умерших.

### Проблема
В катакомбах треснули печати; сочится некротическая течь. Мицелий использует тела как узлы памяти, чтобы запечатать течь световой сетью.

### Методы решения
- Расследование (Дария, реестры Лисандра, схема печатей у «Фалько»).
- Ночное наблюдение за «светопроцессией».
- Ритуалы (общение с грибами, освящение печатей).
- Инженерия (подпорки сводов, кварцевые контуры).
- Изобличить Лисандра или сорвать его поставки солей.

### Ключевые сцены
> «Когда бьют часы, туман встаёт полосами… огни вспыхивают под кожей… нити натягиваются, как струны, и узор печати дышит.»

### Неожиданный твист
**Фалько уже мёртв**, его голос — световая память мицелия; после закрытия течи он просит отпустить его или стать стражем печати.

### Исходы
- **Довериться мицелию**: печать восстановлена, свет гаснет к рассвету.
- **Сжечь грибницу**: краткий успех, затем всплеск нежити.
- **Суд над Лисандром**: социальные последствия.

### Награда
_Споровая свеча памяти_: мягкий свет, помеха скрытности нежити; раз в день — отпечаток эмоций места.
`;

  return {
    title: 'Лунные нити памяти',
    summary: 'Мистический квест о светящихся телах на кладбище и голосе мицелия.',
    status: 'planned',
    content: md,
    tags: ['мистика', 'кладбище', 'мицелий'],
    solutionPaths: ['Расследование', 'Ночное наблюдение', 'Ритуалы', 'Инженерия'],
    relatedNPCs: []
  };
}

export default function QuestsPage() {
  const { data, loading, error, createQuest, updateQuest, deleteQuest, refetch } = useQuests();
  const params = useParams();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => data.find(q => q.id === selectedId) || null, [data, selectedId]);
  const [draft, setDraft] = useState<Quest | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');

  useEffect(() => {
    if (!loading && data.length === 0) {
      createQuest(createSeedQuest()).then(() => {
        message.success('Добавлен пример квеста «Лунные нити памяти»');
        refetch();
      }).catch(() => {});
    }
  }, [loading, data.length, createQuest, refetch]);

  // Синхронизация выбора с роутом /quests/:id
  useEffect(() => {
    const routeId = params.id;
    if (routeId && data.some(q => q.id === routeId)) {
      setSelectedId(routeId);
      setViewMode('view');
    }
  }, [params.id, data]);

  useEffect(() => {
    setDraft(selected ? { ...selected } : null);
    // Убираю автоматическое переключение на редактирование
  }, [selected]);

  const handleCreate = async () => {
    const seed = createSeedQuest();
    const created = await createQuest(seed);
    setSelectedId(created.id);
    setViewMode('edit'); // Новый квест открывается в режиме редактирования
    message.success('Квест создан');
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await updateQuest(draft.id, {
        title: draft.title,
        summary: draft.summary,
        status: draft.status,
        content: draft.content,
        tags: draft.tags,
        relatedLocations: draft.relatedLocations,
        solutionPaths: draft.solutionPaths,
        relatedNPCs: draft.relatedNPCs
      });
      message.success('Сохранено');
    } catch (e) {
      message.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (q: Quest) => {
    Modal.confirm({
      title: 'Удалить квест?',
      content: q.title,
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteQuest(q.id);
        if (selectedId === q.id) setSelectedId(null);
        message.success('Квест удалён');
      }
    });
  };

  const handleQuestClick = (quest: Quest) => {
    setSelectedId(quest.id);
    setViewMode('view'); // Клик по названию открывает только просмотр
    navigate(`/quests/${quest.id}`);
  };

  const handleEditClick = (quest: Quest) => {
    setSelectedId(quest.id);
    setViewMode('edit'); // Клик по иконке карандаша открывает редактирование
  };

  const renderRightPanel = () => {
    if (!selected) {
      return (
        <Card size="small">Выберите квест из списка или создайте новый.</Card>
      );
    }

    if (viewMode === 'view') {
      return (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card size="small" title="Просмотр квеста" extra={
            <Space>
              <Tag color="blue">{selected.status}</Tag>
              <Button size="small" icon={<EditOutlined />} onClick={() => setViewMode('edit')}>
                Редактировать
              </Button>
            </Space>
          }>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {selected.summary && (
                <>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 16, fontStyle: 'italic', margin: 0 }}>
                    {selected.summary}
                  </Typography.Paragraph>
                  <Divider />
                </>
              )}
              
              <div style={{ 
                background: '#fafafa', 
                padding: 16, 
                borderRadius: 6, 
                border: '1px solid #f0f0f0',
                minHeight: 400,
                maxHeight: 600,
                overflow: 'auto'
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selected.content}
                </ReactMarkdown>
              </div>
              
              <Divider />
              <Space split={<Divider type="vertical" />}>
                <Typography.Text type="secondary">Создан: {new Date(selected.createdAt).toLocaleDateString('ru-RU')}</Typography.Text>
                <Typography.Text type="secondary">Обновлён: {new Date(selected.updatedAt).toLocaleDateString('ru-RU')}</Typography.Text>
              </Space>
            </Space>
          </Card>
        </Space>
      );
    }

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <QuestEditor
          value={draft}
          onChange={(next) => setDraft(prev => ({ ...(prev as Quest), ...next }))}
          onSave={handleSave}
          saving={saving}
        />
        <Divider />
        <Title level={5}>Предпросмотр</Title>
        <div style={{ background: '#fff', padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
        </div>
      </Space>
    );
  };

  return (
    <Layout style={{ background: 'transparent' }}>
      <Content>

        
        <Row gutter={16}>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Title level={4} style={{ margin: 0 }}>Квесты</Title>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Новый квест</Button>
                <Button onClick={refetch}>Обновить</Button>
              </Space>
              {loading ? <Spin /> : error ? <Alert type="error" message={error} /> : (
                <List
                  bordered
                  dataSource={data}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button key="edit" icon={<EditOutlined />} type="text" onClick={() => handleEditClick(item)} />,
                        <Button key="del" icon={<DeleteOutlined />} type="text" danger onClick={() => handleDelete(item)} />
                      ]}
                      onClick={() => handleQuestClick(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Space>
                          <strong>{item.title}</strong>
                          <Tag>{item.status}</Tag>
                        </Space>
                        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>{item.summary}</Typography.Paragraph>
                      </Space>
                    </List.Item>
                  )}
                  locale={{ emptyText: <Empty description="Нет квестов" /> }}
                />
              )}
            </Space>
          </Col>
          <Col span={16}>
            {renderRightPanel()}
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}


