import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const nodes = [
  { id: 'NDLS', x: 76, y: 204, label: 'New Delhi', type: 'station' },
  { id: 'SNP', x: 245, y: 130, label: 'Sonipat', type: 'station' },
  { id: 'PNP', x: 412, y: 206, label: 'Panipat', type: 'junction' },
  { id: 'KKDE', x: 586, y: 118, label: 'Kurukshetra', type: 'station' },
  { id: 'UMB', x: 724, y: 202, label: 'Ambala', type: 'junction' },
];
const assets = [{ id: 'TRK-101', x: 319, y: 166, department: 'ENGINEERING', critical: true }, { id: 'SIG-201', x: 498, y: 170, department: 'S&T' }, { id: 'OHE-301', x: 658, y: 161, department: 'TRD' }];
const trains = [{ id: '12952', label: 'Rajdhani', color: '#42d392', delay: 0 }, { id: 'G-4821', label: 'Freight', color: '#e7ad48', delay: 3 }, { id: 'M-06', label: 'Maintenance', color: '#6cb9f2', delay: 6 }];

export function RailNetworkMap({ tasks = [], activeBlocks = 0 }) {
  const [zoom, setZoom] = useState(1); const [selected, setSelected] = useState(null);
  const blocked = activeBlocks > 0 || tasks.some((task) => task.status === 'SCHEDULED');
  const selectedLabel = useMemo(() => selected?.label || selected?.id || 'Hover or select a station, signal, or asset', [selected]);
  return <section className="network-map panel" aria-label="Interactive NDLS to Ambala railway network map">
    <div className="panel-heading"><div><p className="eyebrow">LIVE NETWORK / NDLS–UMB</p><h3>Corridor situation map</h3></div><div className="map-controls" aria-label="Map zoom controls"><button onClick={() => setZoom((value) => Math.min(1.35, value + .1))} aria-label="Zoom in">+</button><button onClick={() => setZoom((value) => Math.max(.8, value - .1))} aria-label="Zoom out">−</button></div></div>
    <div className="map-canvas" role="application" aria-label="Pan and zoom railway network"><motion.svg viewBox="0 0 800 310" animate={{ scale: zoom }} transition={{ type: 'spring', stiffness: 180, damping: 22 }}>
      <path className="map-track sleeper" d="M52 205 C170 205 174 112 245 130 S342 262 412 206 S520 65 586 118 S663 253 748 202" />
      <path className="map-track rail" d="M52 197 C170 197 174 104 245 122 S342 254 412 198 S520 57 586 110 S663 245 748 194" />
      <path className="map-track rail" d="M52 213 C170 213 174 120 245 138 S342 270 412 214 S520 73 586 126 S663 261 748 210" />
      {blocked && <path className="maintenance-zone" d="M284 169 C325 180 351 217 380 221" />}
      {nodes.map((node) => <g className={`map-node ${node.type}`} key={node.id} role="button" tabIndex="0" aria-label={`${node.label} ${node.type}`} onClick={() => setSelected(node)} onKeyDown={(event) => event.key === 'Enter' && setSelected(node)}><circle cx={node.x} cy={node.y} r={node.type === 'junction' ? 10 : 7} /><text x={node.x} y={node.y - 17}>{node.label}</text></g>)}
      {assets.map((asset) => <g className={`map-asset ${asset.critical ? 'critical' : ''}`} key={asset.id} role="button" tabIndex="0" aria-label={`${asset.id}, ${asset.department}${asset.critical ? ', critical' : ''}`} onClick={() => setSelected(asset)} onKeyDown={(event) => event.key === 'Enter' && setSelected(asset)}><circle cx={asset.x} cy={asset.y} r="7" /><circle cx={asset.x} cy={asset.y} r="12" /><text x={asset.x + 13} y={asset.y + 4}>{asset.id}</text></g>)}
      {trains.map((train) => <motion.g key={train.id} className="map-train" initial={{ offsetDistance: '0%' }} animate={{ offsetDistance: '100%' }} transition={{ duration: blocked ? 19 : 13, delay: train.delay, repeat: Infinity, ease: 'linear' }} style={{ offsetPath: "path('M52 205 C170 205 174 112 245 130 S342 262 412 206 S520 65 586 118 S663 253 748 202')" }}><rect x="-11" y="-6" width="22" height="12" rx="3" fill={train.color} /><title>{train.label} {train.id}</title></motion.g>)}
    </motion.svg></div>
    <footer className="map-footer"><span><i className="legend-station" /> Stations / junctions</span><span><i className="legend-asset" /> Assets</span><span><i className="legend-block" /> {blocked ? 'Active possession zone' : 'No active possession'}</span><strong aria-live="polite">{selectedLabel}</strong></footer>
  </section>;
}
