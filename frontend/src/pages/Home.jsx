import { useState, useEffect } from 'react';

import DataTable from '../components/DataTable/index.jsx';
import {
  Autocomplete,
  Button,
  CircularProgress,
  Slider,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// const AVAILABLE_VENDORS = ['aws'];

function Home() {
  dayjs.extend(utc);
  const [associations, setAssociations] = useState([]);

  const [selectedVendor] = useState('aws');
  const [selectedInstances, setSelectedInstances] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [filteredRegions, setFilteredRegions] = useState([]);

  const [tableRowData, setTableRowData] = useState([]);
  const [days, setDays] = useState('');
  const [weight, setWeight] = useState(0.5);

  const [isQueryLoading, setQueryLoading] = useState(false);
  const [isInitRender, setIsInitRender] = useState(true);
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

  const initQueryData = () => {
    setIsInitRender(true);
    setSelectedInstances([]);
    setSelectedRegions([]);
    setFilteredRegions([]);
    setDays('');
    setWeight(0.5);
  };

  const handleSubmit = () => {
    setQueryLoading(true);
    setIsInitRender(false);

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
    <div className="w-full h-[calc(100%-6rem)] flex flex-col items-center py-8 box-border bg-neutral-100">
      <div className="container flex flex-col items-center w-full h-full box-border">
        <div className="grid lg:grid-cols-4 items-center w-full h-full box-border lg:gap-4 gap-8 auto-rows-min lg:auto-rows-auto px-2">
          <div className="bg-white rounded-2xl lg:h-full p-4">
            <div>
              <h2 className="text-xl text-neutral-700">Query Data</h2>
              <div className="flex flex-col gap-5 mt-2">
                <Autocomplete
                  multiple
                  id="instances"
                  disableCloseOnSelect
                  filterSelectedOptions
                  value={selectedInstances}
                  getOptionLabel={(option) => option.name}
                  limitTags={3}
                  renderInput={(params) => (
                    <TextField {...params} label="Instances" />
                  )}
                  options={
                    associations.length > 0 &&
                    typeof associations[0] === 'object'
                      ? Object.keys(associations[0]).map((key) => ({
                          name: key
                        }))
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
                  value={selectedRegions}
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
                  slotProps={{
                    maxLength: 1,
                    inputMode: 'numeric',
                    pattern: '[0-9]*'
                  }}
                  onChange={(e) => setDays(e.target.value)}
                />
                <div className="border-neutral-300 border rounded-md p-2">
                  <label htmlFor="weight" className="text-neutral-600 text-sm">
                    Weight
                  </label>
                  <Slider
                    value={weight}
                    className="text-amber-400"
                    onChange={(event, newValue) => setWeight(newValue)}
                    defaultValue={0.5}
                    valueLabelDisplay="auto"
                    step={0.1}
                    marks
                    min={0}
                    max={1}
                  />
                  <div className="flex justify-between">
                    <label className="text-neutral-600 text-xs">Cost</label>
                    <label className="text-neutral-600 text-xs">
                      Available
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleSubmit}
                disabled={isQueryLoading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-white  mb-2"
              >
                {isQueryLoading ? (
                  <CircularProgress size={24} className="text-neutral-100" />
                ) : (
                  'Submit'
                )}
              </Button>
              <Button
                onClick={initQueryData}
                disabled={isQueryLoading}
                className="w-full bg-neutral-300 hover:bg-neutral-400 text-white"
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="lg:col-span-3 lg:h-full bg-white rounded-2xl overflow-x-hidden py-4 flex flex-col">
            <h2 className="text-xl text-neutral-700 px-4">Result Data</h2>
            <div className="overflow-y-scroll flex-1">
              <DataTable
                vendor={selectedVendor}
                rowData={tableRowData}
                isInitRender={isInitRender}
              />
            </div>
          </div>
        </div>
      </div>

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
