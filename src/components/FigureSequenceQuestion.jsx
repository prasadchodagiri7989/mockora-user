import React from 'react';

/**
 * FigureSequenceQuestion
 * 
 * Renders a dMAT-style figure sequence question using structured SVG data
 * stored as JSON in the question's passageSnippet field.
 * 
 * figureData schema:
 * {
 *   type: 'figure_sequence',
 *   description: string,         // optional label above sequence
 *   sequence: Shape[][]         // array of "frames"; each frame is array of shapes
 *   questionMarkAt: number,     // index (0-based) of the frame replaced by "?"
 *   options: Shape[][]         // 4 option frames [A, B, C, D]
 * }
 * 
 * Shape schema:
 * { kind, x, y, w, h, r, points, fill, stroke, strokeWidth, rotate, text, fontSize }
 * kind: 'rect' | 'circle' | 'triangle' | 'line' | 'cross' | 'star' | 'diamond' | 'text' | 'ellipse' | 'polygon'
 */

const CELL = 80; // size of each figure cell in px

function renderShape(shape, idx) {
  const {
    kind = 'rect',
    x = 40, y = 40,
    w = 30, h = 30,
    r = 15,
    fill = 'none',
    stroke = '#1e293b',
    strokeWidth = 2,
    rotate = 0,
    text = '',
    fontSize = 16,
    opacity = 1,
  } = shape;

  const transform = rotate ? `rotate(${rotate}, ${x}, ${y})` : undefined;
  const common = { fill, stroke, strokeWidth, opacity, transform };

  switch (kind) {
    case 'circle':
      return <circle key={idx} cx={x} cy={y} r={r} {...common} />;

    case 'ellipse':
      return <ellipse key={idx} cx={x} cy={y} rx={shape.rx || r} ry={shape.ry || r * 0.6} {...common} />;

    case 'rect':
      return <rect key={idx} x={x - w / 2} y={y - h / 2} width={w} height={h} {...common} />;

    case 'diamond': {
      const pts = `${x},${y - h / 2} ${x + w / 2},${y} ${x},${y + h / 2} ${x - w / 2},${y}`;
      return <polygon key={idx} points={pts} {...common} />;
    }

    case 'triangle': {
      const pts = `${x},${y - h / 2} ${x + w / 2},${y + h / 2} ${x - w / 2},${y + h / 2}`;
      return <polygon key={idx} points={pts} {...common} />;
    }

    case 'star': {
      const n = 5;
      const outer = r;
      const inner = r * 0.4;
      const pts = Array.from({ length: n * 2 }, (_, i) => {
        const angle = (Math.PI / n) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? outer : inner;
        return `${x + rad * Math.cos(angle)},${y + rad * Math.sin(angle)}`;
      }).join(' ');
      return <polygon key={idx} points={pts} {...common} />;
    }

    case 'cross': {
      const t = strokeWidth * 2.5;
      return (
        <g key={idx} transform={transform} opacity={opacity}>
          <rect x={x - w / 2} y={y - t / 2} width={w} height={t} fill={stroke} stroke="none" />
          <rect x={x - t / 2} y={y - h / 2} width={t} height={h} fill={stroke} stroke="none" />
        </g>
      );
    }

    case 'line':
      return (
        <line
          key={idx}
          x1={shape.x1 ?? x - w / 2}
          y1={shape.y1 ?? y}
          x2={shape.x2 ?? x + w / 2}
          y2={shape.y2 ?? y}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
        />
      );

    case 'text':
      return (
        <text
          key={idx}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize}
          fontWeight="bold"
          fill={stroke}
          fontFamily="monospace"
          opacity={opacity}
          transform={transform}
        >
          {text}
        </text>
      );

    case 'polygon': {
      return <polygon key={idx} points={shape.points} {...common} />;
    }

    default:
      return null;
  }
}

function FigureFrame({ shapes = [], label = '', size = CELL, isQuestion = false }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded-lg border-2 ${isQuestion ? 'border-dashed border-indigo-400 bg-indigo-50/40' : 'border-slate-300 bg-white'}`}
        style={{ width: size + 8, height: size + 8 }}
      >
        {isQuestion ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl font-black text-indigo-400">?</span>
          </div>
        ) : (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
            {shapes.map((shape, i) => renderShape(shape, i))}
          </svg>
        )}
      </div>
      {label && (
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      )}
    </div>
  );
}

function OptionFrame({ shapes = [], label = '', size = CELL, selected = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all cursor-pointer focus:outline-none
        ${selected
          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-200'
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
        }`}
    >
      <div
        className="rounded-md"
        style={{ width: size + 4, height: size + 4 }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
          {shapes.map((shape, i) => renderShape(shape, i))}
        </svg>
      </div>
      <span className={`text-xs font-bold ${selected ? 'text-indigo-600' : 'text-slate-500'}`}>
        {label}
      </span>
    </button>
  );
}

export default function FigureSequenceQuestion({ figureData, selectedOptionIndex, onOptionSelect }) {
  if (!figureData || figureData.type !== 'figure_sequence') return null;

  const { description, sequence = [], questionMarkAt = -1, options = [] } = figureData;
  const optionLabels = ['A', 'B', 'C', 'D'];
  const seqSize = sequence.length <= 6 ? CELL : 66;
  const optSize = CELL;

  return (
    <div className="space-y-6">
      {description && (
        <p className="text-sm text-slate-600 italic border-l-4 border-indigo-200 pl-3 py-1">
          {description}
        </p>
      )}

      {/* Sequence Row */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Figure Sequence — Identify the Pattern
        </p>
        <div className="flex flex-wrap items-center gap-2 justify-center">
          {sequence.map((frame, idx) => {
            const isQM = idx === questionMarkAt;
            return (
              <React.Fragment key={idx}>
                <FigureFrame
                  shapes={frame}
                  label={`Fig ${idx + 1}`}
                  size={seqSize}
                  isQuestion={isQM}
                />
                {idx < sequence.length - 1 && (
                  <span className="text-slate-300 font-bold text-lg">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Options Grid */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Which of the following options replaces the ?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {options.map((optShapes, idx) => (
            <OptionFrame
              key={idx}
              shapes={optShapes}
              label={optionLabels[idx]}
              size={optSize}
              selected={selectedOptionIndex === idx}
              onClick={() => onOptionSelect(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
