import './App.css';
import Header from './components/Header/index.jsx';
import RadioVendor from './components/RadioVendor/index.jsx';
import DataTable from './components/DataTable/index.jsx';
import styled from 'styled-components';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  TextField
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useState } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect } from 'react';

const AVAILABLE_VENDORS = ['aws'];

const Base = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  > .content {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    max-width: 1200px;
    padding: 0px 20px;
  }
`;

const Tooltip = styled.div`
  display: flex;
  align-self: end;
  margin-bottom: 10px;
`;

function App() {
  dayjs.extend(utc);
  const [associations, setAssociations] = useState([]);

  const [isQueryOpen, setQueryOpen] = useState(false);
  const [isStartDate, setIsStartDate] = useState('start');
  const [startDate, setStartDate] = useState(dayjs.utc());
  const [endDate, setEndDate] = useState(dayjs.utc());
  const [selectedInstances, setSelectedInstances] = useState([]);
  const [filteredRegions, setFilteredRegions] = useState([]);

  useEffect(() => {
    fetch(
      'https://spotlake.s3.us-west-2.amazonaws.com/query-selector/associated/association_aws.json'
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setAssociations(data);
        console.log('Fetched Data:', data);
      })
      .catch((error) => {
        console.error('Fetch Error:', error);
      });
  }, []);

  useEffect(() => {
    // 선택된 instances에 따라 Region 필터링
    const regions = selectedInstances
      .map((instance) => associations[0][instance.name]?.Region || [])
      .flat();
    // 중복 제거
    setFilteredRegions([...new Set(regions)]);
  }, [selectedInstances, associations]);

  return (
    <Base>
      <Header />
      <div className={'content'}>
        <RadioVendor vendors={AVAILABLE_VENDORS} />
        <Tooltip>
          <Button variant="contained" onClick={() => setQueryOpen(true)}>
            <SearchOutlinedIcon fontSize={'small'} />
            Query
          </Button>
        </Tooltip>
        <DataTable />
      </div>
      <Dialog fullWidth open={isQueryOpen} onClose={() => setQueryOpen(false)}>
        <DialogTitle>Query</DialogTitle>
        <DialogContent>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: '10px',
              gap: '20px'
            }}
          >
            <Autocomplete
              multiple
              id="instances"
              disableCloseOnSelect
              filterSelectedOptions
              getOptionLabel={(option) => option.name}
              limitTags={2}
              renderInput={(params) => (
                <TextField {...params} label="Instances" />
              )}
              options={
                associations.length > 0 && typeof associations[0] === 'object'
                  ? Object.keys(associations[0]).map((key) => ({ name: key }))
                  : []
              }
              onChange={(event, newValue) => setSelectedInstances(newValue)}
            />

            <Autocomplete
              multiple
              id="regions"
              disableCloseOnSelect
              filterSelectedOptions
              getOptionLabel={(option) => option}
              limitTags={3}
              renderInput={(params) => (
                <TextField {...params} label="Regions" />
              )}
              options={filteredRegions}
              disabled={selectedInstances.length === 0} // instances 선택이 없으면 비활성화
            />
            <FormControl fullWidth>
              <FormLabel id="date-type-radio-group">Date Type</FormLabel>
              <RadioGroup
                row
                aria-labelledby="date-type-radio-group"
                name="date-type-radio-group"
                value={isStartDate}
                onChange={(e) => setIsStartDate(e.target.value)}
              >
                <FormControlLabel
                  value="start"
                  control={<Radio />}
                  label="Start and End Date"
                />
                <FormControlLabel
                  value="day"
                  control={<Radio />}
                  label="Day (s)"
                />
              </RadioGroup>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {isStartDate === 'start' ? (
                <>
                  <DatePicker
                    label="Start Date"
                    maxDate={endDate}
                    slotProps={{
                      field: { clearable: true }
                    }}
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                  />
                  <DatePicker
                    label="End Date"
                    maxDate={endDate}
                    slotProps={{
                      field: { clearable: true }
                    }}
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                  />
                </>
              ) : (
                <TextField id="before-days" label="Day" variant="outlined" />
              )}
            </LocalizationProvider>
            <Stack
              spacing={4}
              direction="row"
              sx={{ alignItems: 'center', mb: 1 }}
            >
              <label>Cost</label>
              <Slider
                defaultValue={0.5}
                valueLabelDisplay="auto"
                step={0.1}
                marks
                min={0}
                max={1}
                aria-label="Volume"
                // value={value}
                // onChange={handleChange}
              />
              <label>Available</label>
            </Stack>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQueryOpen(false)}>Cancel</Button>
          <Button>Submit</Button>
        </DialogActions>
      </Dialog>
    </Base>
  );
}

export default App;
