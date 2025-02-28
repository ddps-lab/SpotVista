import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';

export default function RadioVendor({ vendors }) {
  const [selectedVendor, setSelectedVendor] = useState('aws');

  const handleClick = (vendor) => {
    setSelectedVendor(vendor);
    console.log('Selected Vendor:', vendor);
  };

  return (
    <div className="flex justify-center p-8 gap-8 box-border">
      {vendors &&
        vendors.map((vendor) => (
          <Button
            onClick={() => handleClick(vendor)}
            className={`w-44 min-w-max border-none shadow-md bg-none flex flex-col justify-between ${
              selectedVendor === vendor
                ? 'inset-shadow-vendor bg-[rgba(61,86,178,0.1)]'
                : ''
            }`}
            key={`${vendor}-radio-button`}
          >
            <img
              className="w-15"
              src={`/icons/${vendor}.png`}
              alt={
                vendor === 'aws'
                  ? 'Amazon Web Services'
                  : vendor === 'azure'
                    ? 'Microsoft Azure'
                    : 'Google Cloud Platform'
              }
            />
            <p className="text-gray-700 text-sm font-normal normal-case whitespace-nowrap m-0">
              {vendor === 'aws'
                ? 'Amazon Web Services'
                : vendor === 'azure'
                  ? 'Microsoft Azure'
                  : 'Google Cloud Platform'}
            </p>
          </Button>
        ))}
    </div>
  );
}

RadioVendor.propTypes = {
  vendors: PropTypes.arrayOf(PropTypes.string).isRequired
};
