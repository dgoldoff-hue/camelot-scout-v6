import { useState } from 'react';
import type { Building, PipelineStage } from '@/types';
import { PIPELINE_STAGES } from '@/types';
import { cn, daysInStage, gradeBg, pipelineStageColor, formatCurrency } from '@/lib/utils';
import { useBuildings } from '@/hooks/useBuildings';
import PropertyDetail from './PropertyDetail';
import { GripVertical, MapPin, Building2, ChevronDown, ChevronUp } from 'lucide-react';

interface PipelineBoardProps {
  pipelineData: Record<PipelineStage, Building[]>;
  onMoveBuilding: (id: string, stage: PipelineStage) => void;
}

export default function PipelineBoard({ pipelineData, onMoveBuilding }: PipelineBoardProps) {
  const [detailBuilding, setDetailBuilding] = useState<Building | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<Set<PipelineStage>>(new Set());
  const { updateBuilding } = useBuildings();

  const handleDragStart = (e: React.DragEvent, buildingId: string) => {
    setDraggedId(buildingId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', buildingId);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    const buildingId = e.dataTransfer.getData('text/plain');
    if (buildingId) {
      onMoveBuilding(buildingId, stage);
    }
    setDraggedId(null);
    setDragOverStage(null);
  };

  const toggleCollapse = (stage: PipelineStage) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {PIPELINE_STAGES.map(({ key, label, color }) => {
          const buildings = pipelineData[key] || [];
          const isCollapsed = collapsedStages.has(key);
          const isDragOver = dragOverStage === key;

          return (
            <div
              key={key}
              className={cn(
                'flex-shrink-0 w-72 bg-gray-100 rounded-xl flex flex-col transition-all',
                isDragOver && 'ring-2 ring-camelot-gold bg-camelot-gold/5'
              )}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, key)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', pipelineStageColor(key))} />
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <span className="text-xs bg-white text-gray-500 px-1.5 py-0.5 rounded-full">
                      {buildings.length}
                    </span>
                  </div>
                  <button onClick={() => toggleCollapse(key)} className="p-1 hover:bg-gray-200 rounded">
                    {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
              </div>

              {/* Cards */}
              {!isCollapsed && (
                <div className="flex-1 overflow-y-auto p-2 space-y-2 kanban-column">
                  {buildings.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      Drag properties here
                    </div>
                  ) : (
                    buildings.map((building) => (
                      <div
                        key={building.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, building.id)}
                        onClick={() => setDetailBuilding(building)}
                        className={cn(
                          'bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all group',
                          draggedId === building.id && 'opacity-50 scale-95'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical size={14} className="text-gray-300 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium truncate">
                                {building.name || building.address}
                              </h4>
                              <span className={cn('grade-badge w-5 h-5 text-[10px] border flex-shrink-0', gradeBg(building.grade))}>
                                {building.grade}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                              <MapPin size={10} />
                              <span className="truncate">{building.address}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Building2 size={10} /> {building.units || '—'} units
                              </span>
                              <span>{daysInStage(building.pipeline_moved_at)}d in stage</span>
                            </div>
                            {building.assigned_to && (
                              <div className="mt-2 flex items-center gap-1">
                                <div className="w-5 h-5 bg-camelot-gold/20 rounded-full flex items-center justify-center text-[8px] font-bold text-camelot-gold">
                                  {building.assigned_to.slice(0, 2).toUpperCase()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Property Detail Modal */}
      {detailBuilding && (
        <PropertyDetail
          building={detailBuilding}
          onClose={() => setDetailBuilding(null)}
          onUpdate={updateBuilding}
        />
      )}
    </>
  );
}
