import { Children, Fragment } from 'react';
import { customColumnIndex } from './columns';

export default function ProcurementColumns({ order, standard, renderCustom, children }) {
  const cells = Children.toArray(children);
  return order.map((column) => (
    <Fragment key={column}>
      {column.startsWith('custom-') ? renderCustom(customColumnIndex(column)) : cells[standard.indexOf(column)]}
    </Fragment>
  ));
}
