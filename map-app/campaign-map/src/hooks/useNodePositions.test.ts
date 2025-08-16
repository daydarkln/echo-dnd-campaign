import { renderHook, act } from '@testing-library/react';
import { useNodePositions } from './useNodePositions';
import { GraphNode } from '../types';

// Мокаем localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Мокаем message из antd
jest.mock('antd', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useNodePositions', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'node1',
      type: 'regionNode',
      data: { label: 'Test Node 1', area: 'test-area' },
      position: { x: 100, y: 100 },
    },
    {
      id: 'node2',
      type: 'regionNode',
      data: { label: 'Test Node 2', area: 'test-area' },
      position: { x: 200, y: 200 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with empty positions', () => {
    const { result } = renderHook(() => useNodePositions(mockNodes));
    
    expect(result.current.nodePositions.size).toBe(0);
  });

  it('should load saved positions from localStorage', () => {
    const savedPositions = [
      { id: 'node1', x: 150, y: 150 },
      { id: 'node2', x: 250, y: 250 },
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPositions));

    const { result } = renderHook(() => useNodePositions(mockNodes));
    
    expect(result.current.nodePositions.size).toBe(2);
    expect(result.current.nodePositions.get('node1')).toEqual({ id: 'node1', x: 150, y: 150 });
    expect(result.current.nodePositions.get('node2')).toEqual({ id: 'node2', x: 250, y: 250 });
  });

  it('should update node position', () => {
    const { result } = renderHook(() => useNodePositions(mockNodes));
    
    act(() => {
      result.current.updateNodePosition('node1', 300, 300);
    });
    
    expect(result.current.nodePositions.get('node1')).toEqual({ id: 'node1', x: 300, y: 300 });
  });

  it('should apply saved positions to nodes', () => {
    const { result } = renderHook(() => useNodePositions(mockNodes));
    
    act(() => {
      result.current.updateNodePosition('node1', 150, 150);
      result.current.updateNodePosition('node2', 250, 250);
    });
    
    const updatedNodes = result.current.applySavedPositions(mockNodes);
    
    expect(updatedNodes[0].position).toEqual({ x: 150, y: 150 });
    expect(updatedNodes[1].position).toEqual({ x: 250, y: 250 });
  });

  it('should save positions to localStorage', () => {
    const { result } = renderHook(() => useNodePositions(mockNodes));
    
    act(() => {
      result.current.updateNodePosition('node1', 150, 150);
      result.current.updateNodePosition('node2', 250, 250);
      result.current.saveAllPositions();
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'region-node-positions',
      JSON.stringify([
        { id: 'node1', x: 150, y: 150 },
        { id: 'node2', x: 250, y: 250 },
      ])
    );
  });
}); 