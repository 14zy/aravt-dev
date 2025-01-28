declare module 'react-trello' {
  interface Card {
    id: string;
    title: string;
    description: string;
    label?: string;
    metadata?: any;
  }

  interface Lane {
    id: string;
    title: string;
    label?: string;
    cards: Card[];
  }

  interface BoardData {
    lanes: Lane[];
  }

  interface BoardProps {
    data: BoardData;
    draggable?: boolean;
    laneDraggable?: boolean;
    cardDraggable?: boolean;
    collapsibleLanes?: boolean;
    editable?: boolean;
    canAddLanes?: boolean;
    onCardMoveAcrossLanes?: (cardId: string, sourceLaneId: string, targetLaneId: string) => void;
    style?: React.CSSProperties;
    components?: {
      Card?: React.ComponentType<any>;
    };
  }

  const Board: React.FC<BoardProps>;
  export default Board;
} 