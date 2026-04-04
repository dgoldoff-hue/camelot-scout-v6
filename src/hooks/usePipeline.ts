import { useMemo } from 'react';
import { useBuildingsStore } from '@/lib/store';
import type { Building, PipelineStage } from '@/types';
import { PIPELINE_STAGES } from '@/types';

export function usePipeline() {
  const buildings = useBuildingsStore((s) => s.buildings);

  const pipelineData = useMemo(() => {
    const stages: Record<PipelineStage, Building[]> = {
      discovered: [],
      scored: [],
      contacted: [],
      nurture: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    };

    buildings
      .filter((b) => b.status === 'active')
      .forEach((b) => {
        if (stages[b.pipeline_stage]) {
          stages[b.pipeline_stage].push(b);
        }
      });

    return stages;
  }, [buildings]);

  const stageCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = {} as any;
    PIPELINE_STAGES.forEach(({ key }) => {
      counts[key] = pipelineData[key].length;
    });
    return counts;
  }, [pipelineData]);

  const totalValue = useMemo(() => {
    return buildings
      .filter((b) => b.status === 'active' && b.market_value)
      .reduce((sum, b) => sum + (b.market_value || 0), 0);
  }, [buildings]);

  return {
    pipelineData,
    stageCounts,
    totalValue,
    stages: PIPELINE_STAGES,
  };
}
