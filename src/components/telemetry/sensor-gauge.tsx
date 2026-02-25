"use client";

import type { GaugeZone } from "@/lib/agua-types";

interface SensorGaugeProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  zones: readonly GaugeZone[];
  decimals?: number;
}

// SVG параметры
const VIEW_SIZE = 120;
const CENTER = VIEW_SIZE / 2;
const RADIUS = 44;
const STROKE_WIDTH = 8;
const START_ANGLE = 135;
const SWEEP = 270;
const END_ANGLE = START_ANGLE + SWEEP;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function getColorForValue(
  value: number,
  zones: readonly GaugeZone[]
): string {
  for (const zone of zones) {
    if (value >= zone.min && value <= zone.max) {
      return zone.color;
    }
  }
  return "#6b7280";
}

export function SensorGauge({
  label,
  unit,
  min,
  max,
  value,
  zones,
  decimals = 0,
}: SensorGaugeProps) {
  const clamped = Math.max(min, Math.min(max, value));
  const ratio = (clamped - min) / (max - min);
  const valueAngle = START_ANGLE + ratio * SWEEP;
  const color = getColorForValue(clamped, zones);

  // Позиция стрелки (needle)
  const needleTip = polarToCartesian(CENTER, CENTER, RADIUS - STROKE_WIDTH / 2 - 2, valueAngle);
  const needleBase1 = polarToCartesian(CENTER, CENTER, 4, valueAngle - 90);
  const needleBase2 = polarToCartesian(CENTER, CENTER, 4, valueAngle + 90);

  // Позиции для min/max лейблов
  const minPos = polarToCartesian(CENTER, CENTER, RADIUS + 10, START_ANGLE);
  const maxPos = polarToCartesian(CENTER, CENTER, RADIUS + 10, END_ANGLE);

  return (
    <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className="w-full h-auto">
      {/* Фоновая дуга */}
      <path
        d={describeArc(CENTER, CENTER, RADIUS, START_ANGLE, END_ANGLE)}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />

      {/* Зоны */}
      {zones.map((zone, i) => {
        const zoneStart = START_ANGLE + ((zone.min - min) / (max - min)) * SWEEP;
        const zoneEnd = START_ANGLE + ((zone.max - min) / (max - min)) * SWEEP;
        return (
          <path
            key={i}
            d={describeArc(CENTER, CENTER, RADIUS, zoneStart, zoneEnd)}
            fill="none"
            stroke={zone.color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            opacity={0.2}
          />
        );
      })}

      {/* Дуга значения */}
      {value > min && (
        <path
          d={describeArc(CENTER, CENTER, RADIUS, START_ANGLE, valueAngle)}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
      )}

      {/* Стрелка */}
      <polygon
        points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
        fill={color}
      />
      <circle cx={CENTER} cy={CENTER} r={3} fill={color} />

      {/* Центр: значение + единица */}
      <text
        x={CENTER}
        y={CENTER + 16}
        textAnchor="middle"
        style={{ fill: 'var(--foreground)' }}
        fontSize="14"
        fontWeight="500"
      >
        {value.toFixed(decimals)}
      </text>
      <text
        x={CENTER}
        y={CENTER + 26}
        textAnchor="middle"
        style={{ fill: 'var(--muted-foreground)' }}
        fontSize="8"
      >
        {unit}
      </text>

      {/* min/max лейблы */}
      <text
        x={minPos.x}
        y={minPos.y}
        textAnchor="middle"
        style={{ fill: 'var(--muted-foreground)' }}
        fontSize="7"
      >
        {min}
      </text>
      <text
        x={maxPos.x}
        y={maxPos.y}
        textAnchor="middle"
        style={{ fill: 'var(--muted-foreground)' }}
        fontSize="7"
      >
        {max}
      </text>

      {/* Лейбл снизу */}
      <text
        x={CENTER}
        y={VIEW_SIZE - 4}
        textAnchor="middle"
        style={{ fill: 'var(--muted-foreground)' }}
        fontSize="9"
        fontWeight="500"
      >
        {label}
      </text>
    </svg>
  );
}
