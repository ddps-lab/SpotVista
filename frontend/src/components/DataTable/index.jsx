import { DataGrid } from '@mui/x-data-grid';
import styled from 'styled-components';

const Base = styled.div`
  width: 100%;
  max-width: 1200px;
  height: 100%;
  box-sizing: border-box;
`;

export default function DataTable(props) {
  const { vendor, rows } = props;
  return (
    <Base>
      <DataGrid columns={[]} rows={[]} />
    </Base>
  );
}
