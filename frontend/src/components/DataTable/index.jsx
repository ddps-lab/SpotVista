import { DataGrid } from '@mui/x-data-grid';
import PropTypes from 'prop-types';
import ColumnData from './columnsData';

export default function DataTable({
  vendor,
  rowData,
  isInitRender,
  isLoading
}) {
  const { AWSColumns } = ColumnData();
  return (
    <div className="w-full max-w-full h-full box-border">
      <DataGrid
        columns={vendor === 'aws' ? AWSColumns : []}
        rows={rowData}
        localeText={{
          noRowsLabel:
            isInitRender === true
              ? 'Enter conditions in the query data component and then click "Submit" to see results here.'
              : 'No data found.'
        }}
        slotProps={{
          loadingOverlay: {
            variant: 'linear-progress',
            noRowsVariant: 'skeleton'
          }
        }}
        loading={isLoading}
        className="text-center border-0 rounded-none max-w-full"
        getRowClassName={() => `text-center`}
      />
    </div>
  );
}

DataTable.propTypes = {
  vendor: PropTypes.string.isRequired,
  rowData: PropTypes.arrayOf(PropTypes.object).isRequired,
  isInitRender: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired
};
