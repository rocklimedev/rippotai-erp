// <OrderSheet> — renders a PO / WO built with buildOrderSheet() (order-sheet.jsx).
import { SheetDocument } from './sheet';
import { buildOrderSheet } from './order-sheet';

export default function OrderSheet({ geometry, data, docRef, className = '' }) {
  const { frame, segments, heads } = buildOrderSheet(geometry, data);
  return <SheetDocument ref={docRef} className={`ts-order ${className}`} frame={frame} segments={segments} heads={heads} />;
}
