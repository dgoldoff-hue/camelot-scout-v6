import { usePipeline } from '@/hooks/usePipeline';
import { useBuildings } from '@/hooks/useBuildings';
import PipelineBoard from '@/components/PipelineBoard';
import { formatCurrency } from '@/lib/utils';
import { GitBranch, TrendingUp, Building2, DollarSign, Clock } from 'lucide-react';
import type { PipelineStage } from '@/types';

export default function Pipeline() {
  const { pipelineData, stageCounts, totalValue, stages } = usePipeline();
  const { moveToPipeline } = useBuildings();

  const handleMoveBuilding = (id: string, stage: PipelineStage) => {
    moveToPipeline(id, stage);
  };

  const totalActive = Object.values(stageCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitBranch size={24} className="text-camelot-gold" /> Pipeline
            </h1>
            <p className="text-sm text-gray-500">Drag and drop to move properties between stages</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <Building2 size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold">{totalActive}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <DollarSign size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Portfolio Value</p>
              <p className="font-bold">{formatCurrency(totalValue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
            <TrendingUp size={16} className="text-green-600" />
            <div>
              <p className="text-xs text-green-600">Won</p>
              <p className="font-bold text-green-600">{stageCounts.won}</p>
            </div>
          </div>
          {/* Stage mini pills */}
          <div className="flex items-center gap-1 ml-auto">
            {stages.map(({ key, label, color }) => (
              <div
                key={key}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                style={{ backgroundColor: color + '15', color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {stageCounts[key]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-4">
        <PipelineBoard
          pipelineData={pipelineData}
          onMoveBuilding={handleMoveBuilding}
        />
      </div>
    </div>
  );
}
