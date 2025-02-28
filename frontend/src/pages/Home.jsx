import RadioVendor from '../components/RadioVendor/index.jsx';
import DataTable from '../components/DataTable/index.jsx';

import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  TextField
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect } from 'react';

const AVAILABLE_VENDORS = ['aws'];

function Home() {
  dayjs.extend(utc);
  const [associations, setAssociations] = useState([]);

  const [isQueryOpen, setQueryOpen] = useState(false);
  // const [isStartDate, setIsStartDate] = useState('start');
  // const [startDate, setStartDate] = useState(dayjs.utc());
  // const [endDate, setEndDate] = useState(dayjs.utc());
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
    <div className="w-full h-[calc(100%-6rem)] flex flex-col items-center py-8 box-border">
      <div className="container flex flex-col items-center w-full h-full box-border">
        <RadioVendor vendors={AVAILABLE_VENDORS} />
        <div className="flex justify-end w-full mb-3 box-border">
          <Button variant="contained" onClick={() => setQueryOpen(true)}>
            <SearchOutlinedIcon fontSize={'small'} />
            Query
          </Button>
        </div>
        <DataTable />
      </div>
      <Dialog fullWidth open={isQueryOpen} onClose={() => setQueryOpen(false)}>
        <DialogTitle>Query</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-5 mt-2">
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
            <TextField id="before-days" label="Day" variant="outlined" />
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
    </div>
  );
}

export default Home;
