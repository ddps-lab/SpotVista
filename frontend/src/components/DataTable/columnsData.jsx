const ColumnData = () => {
  //AWS columns
  const AWSColumns = [
    {
      field: 'InstanceType',
      headerName: 'InstanceType',
      headerClassName: 'text-center',
      headerAlign: 'center',
      flex: 0.9,
      align: 'center',
      valueGetter: (value) => {
        return value == -1 ? 'N/A' : value;
      }
    },
    {
      field: 'Region',
      headerName: 'Region',
      flex: 0.9,
      headerClassName: 'text-center',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value) => {
        return value == -1 ? 'N/A' : value;
      }
    },
    {
      field: 'AZ',
      headerName: 'AZ',
      flex: 0.8,
      description:
        'Availability Zone ID. For details, please refer to https://docs.aws.amazon.com/ram/latest/userguide/working-with-az-ids.html',
      headerClassName: 'text-center',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value) => {
        return value == -1 ? 'N/A' : value;
      }
    },
    {
      field: 'SPS',
      headerName: 'SPS',
      flex: 0.8,
      description:
        'In AWS, it is Spot Placement Score. For details, please refer to https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-placement-score.html',
      type: 'number',
      headerClassName: 'text-center',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value) => {
        return value == -1 ? 'N/A' : value;
      }
    },
    {
      field: 'AvailabilityScore',
      headerName: 'SPS Score',
      flex: 0.8,
      description:
        'The maximum number of nodes whose Spot Placement Score (SPS) transitions from 2 to 1 denoted as T2',
      type: 'number',
      headerClassName: 'text-center',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value) => {
        return value == -1 ? 'N/A' : value;
      }
    },
    {
      field: 'SpotPrice',
      headerName: 'SpotPrice ($)',
      type: 'number',
      flex: 0.8,
      headerClassName: 'text-center',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value) => {
        return value == -1 ? 'N/A' : value;
      }
    },
    {
      field: 'CostScore',
      headerName: 'Cost Score',
      type: 'number',
      flex: 0.8,
      headerClassName: 'text-center',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value) => {
        return value == -1 ? 'N/A' : value;
      }
    },
    {
      field: 'Weight',
      headerName: 'Weight',
      flex: 0.5,
      description: 'Weight',
      type: 'number',
      headerClassName: 'text-center',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value) => {
        return value == -1 ? 'N/A' : value;
      }
    },
    {
      field: 'TotalScore',
      headerName: 'Total Score',
      type: 'number',
      flex: 0.8,
      headerClassName: 'text-center',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value) => {
        return value == -1 ? 'N/A' : value;
      }
    }
  ];

  return {
    AWSColumns
  };
};

export default ColumnData;
