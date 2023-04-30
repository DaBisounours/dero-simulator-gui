import React from 'react';
import { Form, InputPicker, SelectPicker } from 'rsuite';
import { appDataAtom, SmartContractData } from '../App';
import { useAtom } from 'jotai';

type Props = {
  onChange: (value: string) => void;
};



export const SmartContractPicker: React.FC<Props> = ({ onChange }) => {
  const handleSelectChange = (value: any) => {
    //console.log("[handleSelectChange] value=", value)
    onChange(value)    
  }
  
  const [appData] = useAtom(appDataAtom);
  const smartContractIds = Object.keys(appData.smartContracts);
  const allSmartContracts = smartContractIds.map((id) => {
    const { name, scid } = appData.smartContracts[id];
    //console.log("[SmartContractPicker] name, scid=", name, scid)
    return { label: name ?? id, value: id, key: id };
    //return { name ?? id, scid ?? id };
  });
  
  return (<>
  
    <Form>
      <Form.Group controlId="selectpicker2">
        <Form.ControlLabel>Select Smart Contract</Form.ControlLabel>
        <SelectPicker
          size="xs"
          data={allSmartContracts}
          style={{ width: 224 }}
          searchable={true}
          onChange={handleSelectChange}
        />
      </Form.Group>
    </Form>
  </>)
}

