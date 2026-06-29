import { formatTrendDay } from "../lib/format";
import type { ActivityTrendPoint } from "../types/api";

interface ActivityTrendChartProps {
  trend: ActivityTrendPoint[];
}

const CHART_WIDTH = 840;
const CHART_HEIGHT = 250;
const PLOT_LEFT = 34;
const PLOT_TOP = 20;
const PLOT_RIGHT = 16;
const PLOT_BOTTOM = 42;

export function ActivityTrendChart({ trend }: ActivityTrendChartProps) {
  const maxCount = Math.max(...trend.map((point) => point.activity_count), 1);
  const plotWidth = CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT;
  const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  const plotBottom = CHART_HEIGHT - PLOT_BOTTOM;
  const slotWidth = trend.length > 0 ? plotWidth / trend.length : plotWidth;
  const barWidth = Math.max(8, Math.min(34, slotWidth * 0.56));

  return (
    <section
      className="rounded-panel border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="activity-trend-title"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="activity-trend-title" className="text-lg font-semibold text-ink">
            Activity over the last 14 days
          </h2>
          <p className="text-sm text-slate-600">UTC daily counts, including explicit zero-activity days.</p>
        </div>
        <span className="text-sm text-slate-500">{trend.length} daily points</span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          className="block h-64 min-w-[640px] w-full"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label={buildTrendDescription(trend)}
        >
          <line
            x1={PLOT_LEFT}
            x2={CHART_WIDTH - PLOT_RIGHT}
            y1={plotBottom}
            y2={plotBottom}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <line
            x1={PLOT_LEFT}
            x2={CHART_WIDTH - PLOT_RIGHT}
            y1={PLOT_TOP + plotHeight / 2}
            y2={PLOT_TOP + plotHeight / 2}
            stroke="#e2e8f0"
            strokeDasharray="3 5"
            strokeWidth="1"
          />
          <line
            x1={PLOT_LEFT}
            x2={CHART_WIDTH - PLOT_RIGHT}
            y1={PLOT_TOP}
            y2={PLOT_TOP}
            stroke="#e2e8f0"
            strokeDasharray="3 5"
            strokeWidth="1"
          />
          <text x="4" y={PLOT_TOP + 4} fill="#64748b" fontSize="11">
            {maxCount}
          </text>
          <text x="10" y={plotBottom + 4} fill="#64748b" fontSize="11">
            0
          </text>

          {trend.map((point, index) => {
            const computedHeight = (point.activity_count / maxCount) * plotHeight;
            const barHeight = point.activity_count === 0 ? 4 : Math.max(10, computedHeight);
            const barX = PLOT_LEFT + index * slotWidth + (slotWidth - barWidth) / 2;
            const barY = plotBottom - barHeight;
            const showLabel = index % 2 === 0 || index === trend.length - 1;

            return (
              <g key={point.day}>
                <title>{`${formatTrendDay(point.day)}: ${point.activity_count} activities`}</title>
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill={point.activity_count === 0 ? "#ddd6fe" : "#a855f7"}
                />
                {showLabel ? (
                  <text
                    x={barX + barWidth / 2}
                    y={CHART_HEIGHT - 14}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {formatTrendDay(point.day)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>Hover or focus a bar for its date and count.</span>
        <span>Peak: {maxCount} activities</span>
      </div>
    </section>
  );
}

function buildTrendDescription(trend: ActivityTrendPoint[]): string {
  return trend
    .map((point) => `${formatTrendDay(point.day)}: ${point.activity_count} activities`)
    .join(". ");
}
