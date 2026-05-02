import React from 'react';

export default function PointDescriptionEngine({ points }: { points: {title: string, desc: string}[] }) {
  if (!points || points.length === 0) return null;

  return (
    <ul className="space-y-2 mt-4 text-sm bg-stone-50 p-4 rounded-2xl">
      {points.map((pt, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-orange-500 mt-1">•</span>
          <div>
            <span className="font-semibold text-stone-900">{pt.title}: </span>
            <span className="text-stone-600">{pt.desc}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
