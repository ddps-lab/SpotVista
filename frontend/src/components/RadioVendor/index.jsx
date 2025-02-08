import styled from 'styled-components';
import { Button } from '@mui/material';

const Group = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 30px 0;
`;

const Radio = styled(Button)`
  width: 180px;
  min-width: max-content !important;
  border: none;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.26);
  background: none;
  flex-direction: column;
  justify-content: space-between !important;
  ${(props) =>
    props.clicked === true &&
    'box-shadow: inset 2px 2px 4px rgba(0,0,0,0.16); background:rgb(61,86,178, 0.1) !important;'}

  > .vendor-icon {
    width: 60px;
  }

  > .vendor-title {
    color: #555;
    font-size: 14px;
    font-weight: 400;
    text-transform: none;
    white-space: nowrap;
    margin: 0 !important;
  }
`;

export default function RadioVendor(props) {
  return (
    <Group>
      {props.vendors &&
        props.vendors.map((vendor) => {
          if (vendor === 'aws')
            return (
              <Radio
                onClick={() => {}}
                clicked={true}
                disabled={false}
                key={`${vendor}-radio-button`}
              >
                <img
                  className={'vendor-icon'}
                  src={'/icons/' + vendor + '.png'}
                  alt={'Amazon Web Services'}
                />
                <p className={'vendor-title'}>Amazon Web Services</p>
              </Radio>
            );
          else if (vendor === 'azure')
            return (
              <Radio
                onClick={() => {}}
                clicked={false}
                disabled={false}
                key={`${vendor}-radio-button`}
              >
                <img
                  className={'vendor-icon'}
                  src={'/icons/' + vendor + '.png'}
                  alt={'Microsoft Azure'}
                />
                <p className={'vendor-title'}>Microsoft Azure</p>
              </Radio>
            );
          else if (vendor === 'gcp')
            return (
              <Radio
                onClick={() => {}}
                clicked={false}
                disabled={false}
                key={`${vendor}-radio-button`}
              >
                <img
                  className={'vendor-icon'}
                  src={'/icons/' + vendor + '.png'}
                  alt={'Google Cloud Platform'}
                />
                <p className={'vendor-title'}>Google Cloud Platform</p>
              </Radio>
            );
        })}
    </Group>
  );
}
