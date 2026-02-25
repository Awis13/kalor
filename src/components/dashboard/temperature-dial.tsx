"use client";

import { useCallback, useRef, useState } from "react";

interface TemperatureDialProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void; // вызывается только при отпускании (drag end)
}

const CENTER = 120;
const RADIUS = 95;
const STROKE_WIDTH = 16;
const START_ANGLE = 135;
const END_ANGLE = 405;
const SWEEP = END_ANGLE - START_ANGLE; // 270°

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

function angleFromEvent(
  svgRef: React.RefObject<SVGSVGElement | null>,
  clientX: number,
  clientY: number
): number {
  const svg = svgRef.current;
  if (!svg) return 0;
  const rect = svg.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (angle < 0) angle += 360;
  return angle;
}

export function TemperatureDial({
  value,
  min,
  max,
  onChange,
}: TemperatureDialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Локальное значение при драге — не шлём API на каждый пиксель
  const [dragValue, setDragValue] = useState<number | null>(null);

  const displayValue = dragValue ?? value;

  const valueToAngle = useCallback(
    (v: number) => {
      const clamped = Math.max(min, Math.min(max, v));
      return START_ANGLE + ((clamped - min) / (max - min)) * SWEEP;
    },
    [min, max]
  );

  const angleToValue = useCallback(
    (angle: number) => {
      let normalized = angle;
      if (normalized < START_ANGLE) normalized += 360;
      const clamped = Math.max(START_ANGLE, Math.min(END_ANGLE, normalized));
      const ratio = (clamped - START_ANGLE) / SWEEP;
      const rawValue = min + ratio * (max - min);
      return Math.round(rawValue);
    },
    [min, max]
  );

  const updateDragValue = useCallback(
    (clientX: number, clientY: number) => {
      const angle = angleFromEvent(svgRef, clientX, clientY);
      setDragValue(angleToValue(angle));
    },
    [angleToValue]
  );

  // При отпускании — коммитим значение в API
  const commitValue = useCallback(() => {
    if (dragValue !== null && dragValue !== value) {
      onChange(dragValue);
    }
    setDragValue(null);
    setIsDragging(false);
  }, [dragValue, value, onChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      updateDragValue(e.clientX, e.clientY);
    },
    [updateDragValue]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      updateDragValue(e.clientX, e.clientY);
    },
    [isDragging, updateDragValue]
  );

  const handleMouseUp = useCallback(() => {
    commitValue();
  }, [commitValue]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      const touch = e.touches[0];
      updateDragValue(touch.clientX, touch.clientY);
    },
    [updateDragValue]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      updateDragValue(touch.clientX, touch.clientY);
    },
    [isDragging, updateDragValue]
  );

  const handleTouchEnd = useCallback(() => {
    commitValue();
  }, [commitValue]);

  const currentAngle = valueToAngle(displayValue);
  const knobPos = polarToCartesian(CENTER, CENTER, RADIUS, currentAngle);

  // Тик-марки
  const ticks = [];
  const tickCount = max - min;
  for (let i = 0; i <= tickCount; i++) {
    const tickValue = min + i;
    const tickAngle = valueToAngle(tickValue);
    const isMajor = i % 5 === 0;
    const innerR = isMajor ? RADIUS - 24 : RADIUS - 18;
    const outerR = RADIUS - 12;
    const p1 = polarToCartesian(CENTER, CENTER, innerR, tickAngle);
    const p2 = polarToCartesian(CENTER, CENTER, outerR, tickAngle);
    ticks.push(
      <line
        key={i}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={isMajor ? "var(--muted-foreground)" : "var(--border)"}
        strokeWidth={isMajor ? 2 : 0.8}
      />
    );

    // Числа на мажорных тиках
    if (isMajor) {
      const labelR = RADIUS - 32;
      const lp = polarToCartesian(CENTER, CENTER, labelR, tickAngle);
      ticks.push(
        <text
          key={`label-${i}`}
          x={lp.x}
          y={lp.y}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fill: 'var(--muted-foreground)' }}
          fontSize="10"
        >
          {tickValue}
        </text>
      );
    }
  }

  return (
    <div className="flex items-center justify-center py-2">
      <svg
        ref={svgRef}
        viewBox="0 0 240 240"
        width="260"
        height="260"
        className="cursor-pointer touch-none select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Градиент для дуги значения */}
        <defs>
          <linearGradient id="dialGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          {/* Свечение вокруг ручки */}
          <filter id="knobGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Фоновая дуга */}
        <path
          d={describeArc(CENTER, CENTER, RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          opacity={0.4}
        />

        {/* Дуга значения */}
        {displayValue > min && (
          <path
            d={describeArc(CENTER, CENTER, RADIUS, START_ANGLE, currentAngle)}
            fill="none"
            stroke="url(#dialGrad)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
        )}

        {/* Тик-марки и числа */}
        {ticks}

        {/* Ручка */}
        <circle
          cx={knobPos.x}
          cy={knobPos.y}
          r={10}
          fill="#f59e0b"
          stroke="white"
          strokeWidth={2.5}
          filter="url(#knobGlow)"
        />

        {/* Центральный текст */}
        <text
          x={CENTER}
          y={CENTER - 8}
          textAnchor="middle"
          style={{ fill: 'var(--foreground)' }}
          fontSize="36"
          fontWeight="300"
        >
          {displayValue}°
        </text>
        <text
          x={CENTER}
          y={CENTER + 16}
          textAnchor="middle"
          style={{ fill: 'var(--muted-foreground)' }}
          fontSize="12"
        >
          Target
        </text>
      </svg>
    </div>
  );
}
