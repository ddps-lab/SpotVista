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
    setTableRowData([]);
    setSelectedInstances([]);
    setSelectedRegions([]);
    setFilteredRegions([]);
    setDays('');
    setWeight(0.5);
  };

  const isVaildInpit = () => {
    if (selectedInstances.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one instance type.',
        severity: 'error'
      });
      return false;
    }
    if (selectedRegions.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one region.',
        severity: 'error'
      });
      return false;
    }
    if (days === '') {
      setSnackbar({
        open: true,
        message: 'Please enter the number of days.',
        severity: 'error'
      });
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!isVaildInpit()) {
      return;
    }

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
    <div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center py-6 box-border bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container flex flex-col items-center w-full h-full box-border">
        <div className="grid lg:grid-cols-4 items-center w-full h-full box-border lg:gap-6 gap-8 auto-rows-min lg:auto-rows-auto px-4">
          <div className="bg-white rounded-2xl lg:h-full p-4 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-lg font-bold text-gray-800">Query Configuration</h2>
              </div>
              <div className="flex flex-col gap-5 space-y-1">
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Instance Types</label>
                  <Autocomplete
                    multiple
                    id="instances"
                    disableCloseOnSelect
                    filterSelectedOptions
                    value={selectedInstances}
                    getOptionLabel={(option) => option.name}
                    limitTags={2}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select up to 3 instances"
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#fbbf24',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#f59e0b',
                            },
                          },
                        }}
                      />
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
                    onChange={(_, newValue) => setSelectedInstances(newValue)}
                  />
                </div>
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Regions</label>
                  <Autocomplete
                    multiple
                    id="regions"
                    disableCloseOnSelect
                    filterSelectedOptions
                    value={selectedRegions}
                    getOptionLabel={(option) => option}
                    limitTags={2}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select up to 3 regions"
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#fbbf24',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#f59e0b',
                            },
                          },
                        }}
                      />
                    )}
                    options={filteredRegions}
                    disabled={selectedInstances.length === 0}
                    getOptionDisabled={() =>
                      selectedRegions.length >= 3 ? true : false
                    }
                    onChange={(_, newValue) => setSelectedRegions(newValue)}
                  />
                </div>
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Analysis Period (Days)</label>
                  <TextField
                    id="before-days"
                    placeholder="Enter number of days"
                    variant="outlined"
                    size="small"
                    fullWidth
                    type="number"
                    value={days}
                    slotProps={{
                      maxLength: 1,
                      inputMode: 'numeric',
                      pattern: '[0-9]*'
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#fbbf24',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#f59e0b',
                        },
                      },
                    }}
                    onChange={(e) => setDays(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <label htmlFor="weight" className="text-xs font-semibold text-gray-600 mb-1 block">
                    Weight
                  </label>
                  <div className="border border-gray-300 rounded-md p-3">
                    <Slider
                      value={weight}
                      sx={{
                        color: '#f59e0b',
                        '& .MuiSlider-thumb': {
                          backgroundColor: '#f59e0b',
                          '&:hover': {
                            backgroundColor: '#d97706',
                          },
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: '#f59e0b',
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: '#e5e7eb',
                        },
                      }}
                      onChange={(_, newValue) => setWeight(newValue)}
                      defaultValue={0.5}
                      valueLabelDisplay="auto"
                      step={0.1}
                      marks
                      min={0}
                      max={1}
                    />
                    <div className="flex justify-between mt-1">
                      <label className="text-gray-600 text-xs">Cost</label>
                      <label className="text-gray-600 text-xs">Available</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={isQueryLoading}
                variant="contained"
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '12px',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontSize: '16px',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d97706 0%, #c2410c 100%)',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                  },
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af',
                  }
                }}
              >
                {isQueryLoading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Analyze Spot Instances
                  </>
                )}
              </Button>
              <Button
                onClick={initQueryData}
                disabled={isQueryLoading}
                variant="outlined"
                fullWidth
                sx={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  padding: '10px',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    backgroundColor: '#f9fafb',
                  },
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Configuration
              </Button>
            </div>
          </div>

          <div className="lg:col-span-3 lg:h-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-x-hidden p-4 flex flex-col hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-lg font-bold text-gray-800">Analysis Results</h2>
              </div>
              {!isInitRender && tableRowData.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{tableRowData.length} recommendations found</span>
                </div>
              )}
            </div>
            <div className="overflow-y-auto flex-1 px-2">
              <DataTable
                vendor={selectedVendor}
                rowData={tableRowData}
                isInitRender={isInitRender}
                isLoading={isQueryLoading}
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
