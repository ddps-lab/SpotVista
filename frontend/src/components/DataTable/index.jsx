import { DataGrid } from '@mui/x-data-grid';
import PropTypes from 'prop-types';
import ColumnData from './columnsData';

export default function DataTable({ vendor, rowdata }) {
  const { AWSColumns } = ColumnData();
  return (
    <div className="w-full h-full box-border">
      <DataGrid columns={vendor === 'AWS' ? AWSColumns : []} rows={rowdata} />
    </div>
  );
}

DataTable.propTypes = {
  vendor: PropTypes.string.isRequired,
  rowdata: PropTypes.arrayOf(PropTypes.object).isRequired
};
