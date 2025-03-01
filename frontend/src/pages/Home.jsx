import { useState, useEffect } from 'react';

import RadioVendor from '../components/RadioVendor/index.jsx';
import DataTable from '../components/DataTable/index.jsx';
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Slider,
  Stack,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

const AVAILABLE_VENDORS = ['aws'];

function Home() {
  dayjs.extend(utc);
  const [associations, setAssociations] = useState([]);

  const [selectedVendor, setSelectedVendor] = useState('aws');
  const [selectedInstances, setSelectedInstances] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [filteredRegions, setFilteredRegions] = useState([]);

  const [tablerowdata, setTableRowData] = useState([]);
  const [days, setDays] = useState('');
  const [weight, setWeight] = useState(0.5);

  const [isQueryOpen, setQueryOpen] = useState(false);
  const [isQueryLoading, setQueryLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetch(
      `https://spotlake.s3.us-west-2.amazonaws.com/query-selector/associated/association_${selectedVendor}.json`
    )
      .then((res) => res.json())
      .then((data) => setAssociations(data))
      .catch((error) => console.error('Fetch Error:', error));
  }, [selectedVendor]);

  useEffect(() => {
    const regions = selectedInstances
      .map((instance) => associations[0][instance.name]?.Region || [])
      .flat();
    setFilteredRegions([...new Set(regions)]);
  }, [selectedInstances, associations]);

  const initFormData = () => {
    setSelectedInstances([]);
    setSelectedRegions([]);
    setFilteredRegions([]);
    setDays('');
    setWeight(0.5);
  };

  const handleSubmit = () => {
    setQueryLoading(true);

    const payload = {
      days: parseInt(days),
      instance_types: selectedInstances.map((instance) => instance.name),
      regions: selectedRegions,
      weight
    };

    fetch(
      'https://2avbkrwyq5.execute-api.us-west-2.amazonaws.com/default/sandevistan_api',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    )
      .then((response) => {
        setQueryOpen(false);
        initFormData();
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then((data) => {
        setQueryLoading(false);
        setTableRowData(data);
        setSnackbar({
          open: true,
          message: 'Query submitted successfully!',
          severity: 'success'
        });
      })
      .catch((error) => {
        setQueryLoading(false);
        setSnackbar({
          open: true,
          message: `Failed to submit query. ${error}`,
          severity: 'error'
        });
      });
  };

  return (
    <div className="w-full h-[calc(100%-6rem)] flex flex-col items-center py-8 box-border">
      <div className="container flex flex-col items-center w-full h-full box-border">
        <RadioVendor
          vendors={AVAILABLE_VENDORS}
          selectedVendor={selectedVendor}
          setSelectedVendor={setSelectedVendor}
        />
        <div className="flex justify-end w-full mb-3 box-border">
          <Button
            variant="contained"
            onClick={() => setQueryOpen(true)}
            disabled={isQueryLoading}
          >
            {isQueryLoading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <SearchOutlinedIcon fontSize={'small'} />
                Query
              </>
            )}
          </Button>
        </div>
        <DataTable vendor={selectedVendor} rowdata={tablerowdata} />
      </div>
      <Dialog fullWidth open={isQueryOpen} onClose={() => setQueryOpen(false)}>
        <DialogContent>
          <div className="flex flex-col gap-5 mt-2 p-8">
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
              getOptionDisabled={() =>
                selectedInstances.length >= 3 ? true : false
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
              disabled={selectedInstances.length === 0}
              getOptionDisabled={() =>
                selectedRegions.length >= 3 ? true : false
              }
              onChange={(event, newValue) => setSelectedRegions(newValue)}
            />
            <TextField
              id="before-days"
              label="Day"
              variant="outlined"
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
            <Stack
              spacing={4}
              direction="row"
              sx={{ alignItems: 'center', mb: 1 }}
            >
              <label>Cost</label>
              <Slider
                value={weight}
                onChange={(event, newValue) => setWeight(newValue)}
                defaultValue={0.5}
                valueLabelDisplay="auto"
                step={0.1}
                marks
                min={0}
                max={1}
                aria-label="Volume"
              />
              <label>Available</label>
            </Stack>
          </div>
        </DialogContent>
        <DialogActions>
          <div className="p-2">
            <Button onClick={() => setQueryOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isQueryLoading}>
              {isQueryLoading ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          </div>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Home;
