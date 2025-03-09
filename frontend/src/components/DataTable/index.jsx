import { DataGrid } from '@mui/x-data-grid';
import PropTypes from 'prop-types';
import ColumnData from './columnsData';

export default function DataTable({ vendor, rowData }) {
  const { AWSColumns } = ColumnData();
  return (
    <div className="w-full h-full box-border">
      <DataGrid
        columns={vendor === 'aws' ? AWSColumns : []}
        rows={rowData}
        className="text-center"
        getRowClassName={() => `text-center`}
      />
    </div>
  );
}

DataTable.propTypes = {
  vendor: PropTypes.string.isRequired,
  rowData: PropTypes.arrayOf(PropTypes.object).isRequired
};
