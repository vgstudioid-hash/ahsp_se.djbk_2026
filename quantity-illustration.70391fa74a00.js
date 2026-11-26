const dimensionUnit=value=>['m','cm','mm'].includes(value)?value:'m';
const label=(x,y,text,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${text}</text>`;

export function shapeIllustration(key,unit='m'){
 const u=dimensionUnit(unit),d=name=>`${name} (${u})`;
 const drawings={
  count:'<circle cx="70" cy="65" r="15"/><circle cx="130" cy="65" r="15"/><circle cx="190" cy="65" r="15"/>',
  length:`<path d="M35 85h210m-210-10v20m210-20v20"/>${label(140,68,d('L'))}`,
  square:`<path d="M75 25h110v110H75z"/>${label(130,153,d('s'))}`,
  rectangle:`<path d="M40 35h200v90H40z"/>${label(140,148,d('p'))}${label(244,84,d('l'),'start')}`,
  triangle:`<path d="M40 130h200L140 20zM140 20v110"/>${label(140,151,d('alas'))}${label(147,80,d('t'),'start')}`,
  trapezoid:`<path d="M80 30h120l45 100H35zM140 30v100"/>${label(140,22,d('a'))}${label(140,151,d('b'))}${label(147,85,d('t'),'start')}`,
  parallelogram:`<path d="M80 30h165l-45 100H35zM80 30v100"/>${label(140,151,d('alas'))}${label(87,85,d('t'),'start')}`,
  rhombus:`<path d="m140 15 95 65-95 65-95-65zM140 15v130M45 80h190"/>${label(140,72,d('d₁'))}${label(147,116,d('d₂'),'start')}`,
  kite:`<path d="m140 15 80 50-80 85-80-85zM140 15v135M60 65h160"/>${label(140,57,d('d₁'))}${label(147,115,d('d₂'),'start')}`,
  circle:`<circle cx="140" cy="80" r="60"/><path d="M140 80h60"/>${label(168,72,d('r'))}`,
  ellipse:`<ellipse cx="140" cy="80" rx="100" ry="55"/><path d="M140 25v55h100"/>${label(190,72,d('a'))}${label(148,48,d('b'),'start')}`,
  box:`<path d="M45 60h145v85H45zM45 60l45-40h145v85l-45 40M190 60l45-40M190 60v85"/>${label(118,163,d('p'))}${label(218,139,d('l'))}${label(239,83,d('t'),'start')}`,
  cube:`<path d="M75 55h100v90H75zM75 55l40-35h100v90l-40 35M175 55l40-35"/>${label(125,163,d('s'))}`,
  cylinder:`<ellipse cx="140" cy="35" rx="65" ry="20"/><path d="M75 35v90c0 28 130 28 130 0V35M140 35h65"/>${label(172,28,d('r'))}${label(211,88,d('t'),'start')}`,
  cone:`<ellipse cx="140" cy="135" rx="75" ry="20"/><path d="m65 135 75-120 75 120M140 15v120h75"/>${label(177,128,d('r'))}${label(147,80,d('t'),'start')}`,
  sphere:`<circle cx="140" cy="85" r="65"/><ellipse cx="140" cy="85" rx="65" ry="20"/><path d="M140 85h65"/>${label(171,78,d('r'))}`,
  triangularPrism:`<path d="m40 130 50-100 50 100zm50-100 95-15 55 100-100 15M40 130l95-15M185 15l-50 100h105M90 30v100"/>${label(90,151,d('alas'))}${label(96,83,d('t'))}${label(189,143,d('p'))}`,
  trapezoidalPrism:`<path d="m35 130 35-75h90l35 75zm35-75 65-40h90l35 75-65 40M160 55l65-40M195 130l65-40M115 55v75"/>${label(115,48,d('a'))}${label(115,151,d('b'))}${label(122,94,d('t'),'start')}${label(226,118,d('p'))}`
 };
 return `<svg viewBox="0 0 280 175" role="img" aria-label="Ilustrasi bentuk ${key}; satuan dimensi ${u}" fill="none" stroke="#527b66" stroke-width="2"><g>${drawings[key]||drawings.rectangle}</g><style>text{fill:#174b41;stroke:none;font:11px Inter,"Segoe UI",Arial,sans-serif;font-weight:600}</style></svg>`;
}
