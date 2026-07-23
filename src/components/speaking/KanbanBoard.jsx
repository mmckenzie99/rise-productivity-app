import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { STATUSES, statusTone } from '@/lib/speaking';
import KanbanCard from './KanbanCard';

const COLUMN_TONE = {
  Planning: 'border-t-[#D9A404]',
  Confirmed: 'border-t-[#1B2A4B]',
  Completed: 'border-t-[#5A6781]'
};

const STORAGE_KEY = 'kanbanColumnOrder';

const loadOrder = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
};

export default function KanbanBoard({ items, onSave, onSelect, isAdmin }) {
  const [dragId, setDragId] = useState(null);
  const [columnOrder, setColumnOrder] = useState(loadOrder);

  const sortByOrder = (status, list) => {
    const ord = columnOrder[status] || [];
    const orderMap = new Map(ord.map((id, i) => [id, i]));
    return [...list].sort((a, b) => {
      const ai = orderMap.get(a.id);
      const bi = orderMap.get(b.id);
      if (ai !== undefined && bi !== undefined) return ai - bi;
      if (ai !== undefined) return -1;
      if (bi !== undefined) return 1;
      return 0;
    });
  };

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = sortByOrder(s, items.filter(i => i.status === s));
    return acc;
  }, {});

  const persist = (next) => {
    setColumnOrder(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const onDragEnd = (result) => {
    setDragId(null);
    if (!result.destination) return;
    const { source, destination } = result;
    const srcStatus = source.droppableId;
    const destStatus = destination.droppableId;
    const item = items.find(i => i.id === result.draggableId);
    if (!item) return;

    // Reorder within the same column — persist the new order.
    if (srcStatus === destStatus) {
      const colItems = [...grouped[srcStatus]];
      const [moved] = colItems.splice(source.index, 1);
      colItems.splice(destination.index, 0, moved);
      persist({ ...columnOrder, [srcStatus]: colItems.map(i => i.id) });
      return;
    }

    // Cross-column move — update status and both columns' order.
    if (item.status === destStatus) return;
    const next = { ...columnOrder };
    next[srcStatus] = (grouped[srcStatus] || []).map(i => i.id).filter(id => id !== item.id);
    const destIds = (grouped[destStatus] || []).map(i => i.id);
    destIds.splice(destination.index, 0, item.id);
    next[destStatus] = destIds;
    persist(next);
    onSave({ ...item, status: destStatus });
  };

  return (
    <DragDropContext onDragStart={(s) => setDragId(s.draggableId)} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        {STATUSES.map(status => (
          <Droppable key={status} droppableId={status} isDropDisabled={!isAdmin}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex flex-col rounded-lg border border-[#D6DAE3] border-t-4 ${COLUMN_TONE[status]} bg-[#F0F2F6] p-3 transition min-w-[78%] sm:min-w-[300px] md:min-w-0 shrink-0 ${snapshot.isDraggingOver ? 'bg-[#E8EBF2]' : ''}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">{status}</h3>
                  <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${statusTone[status]}`}>
                    {grouped[status].length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 min-h-[60px]">
                  {grouped[status].map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!isAdmin}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`transition ${dragSnapshot.isDragging ? 'opacity-80 shadow-lg' : ''} ${dragId === item.id ? 'ring-2 ring-[#D9A404] ring-offset-1' : ''}`}
                        >
                          <KanbanCard item={item} onClick={() => onSelect(item)} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {grouped[status].length === 0 && (
                    <p className="py-6 text-center text-xs text-[#D9A404]">
                      {isAdmin ? 'Drop a card here' : 'Nothing here'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}