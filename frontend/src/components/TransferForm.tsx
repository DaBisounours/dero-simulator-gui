import { Button, Form, InputPicker } from 'rsuite';
import { useState } from 'react';

import { SimulatorState, appDataAtom, AppContextData } from "../App";
import { useAtom } from "jotai";
import { deroToUnit, shortAddress } from '../utils';

import { transferButtonStateAtom } from '../routes/Wallets'


type TransferFormData = {
  addressTo: string,
  amount: number,
  fees: number
}

const TransferForm = (props: any) => {
  const [appData] = useAtom(appDataAtom)
  const [transferButtonState, ] = useAtom(transferButtonStateAtom)
  // Get an array of wallet IDs
  const walletIds = Object.keys(appData.wallets);
  // Map over the wallet IDs and render some information about each wallet
  
  const walletListInput = walletIds.map((walletId) => {
    const walletData = appData.wallets[walletId];
    const label = 'w' + walletId.slice(6).padEnd(4, ' ') + '' + shortAddress(walletData.address ?? '')
    //const label = 'w' + walletId.slice(6).padEnd(4, ' ') + '' + walletData.address
    return { label: label, value: walletData.address}
  });
  //console.log('HERE')
  const [formData, setFormData] = useState<TransferFormData>({ addressTo: '', amount: 0, fees: 0 });
  const [amountColor, setAmountColor] = useState("inherit")
  const walletBalance = props.balance

  const handleTransfer = ()  => {
    //console.log('Form submitted', formData);
    // call function to handle transfer with formData values
    props.transferClickHandler(formData.addressTo, deroToUnit(formData.amount) )
  }

  const handleInputChange = (fieldName: keyof TransferFormData, value: string | number) => {
    if (fieldName === "amount" && walletBalance < value) {
      //console.log("Not enough balance...", walletBalance);
      setAmountColor("red"); // set color to red
    } else {
      setAmountColor("inherit"); // reset to default
    }
    setFormData(prevState => ({
      ...prevState,
      [fieldName]: value
    }));
  }

  return (
    <>
    <Form>
      <Form.Group style={{ marginBottom: '10px'}}>
        <Form.ControlLabel style={{ marginBottom: '0px' }}>Address To:</Form.ControlLabel>
        <Form.Control style={{ width: '520px' }} name="addressTo" value={formData.addressTo} onChange={(value) => handleInputChange('addressTo', value)} />        
        <InputPicker 
          name="addressToPicker" size="xs" style={{ marginLeft: '4px', width: 80 }} data={walletListInput} value={formData.addressTo}  
          onChange={(value) => setFormData({
            ...formData,
            ['addressTo']: value
          })} 
        />
        <Form.HelpText tooltip>Enter the recipient's address</Form.HelpText>
      </Form.Group>
    </Form>
    <Form layout="inline">
      <Form.Group style={{ marginBottom: '10px' }}>
        <Form.ControlLabel style={{ marginBottom: '0px' }}>Amount:</Form.ControlLabel>
        <Form.Control 
          style={{ width: '100px', color: amountColor }} 
          name="amount" 
          type="number" 
          step={0.01} 
          value={formData.amount} 
          onChange={(value) => handleInputChange('amount', value)} 
        />
        <Form.HelpText tooltip>Enter the amount to transfer in DERO</Form.HelpText>
      </Form.Group>
      <Form.Group style={{ marginBottom: '10px' }}>
        <Form.ControlLabel style={{ marginBottom: '0px' }}>Fees:</Form.ControlLabel>
        <Form.Control style={{ width: '50px' }} readOnly={true} name="fees" type="number" step={0.0001} value={formData.fees} onChange={(value) => handleInputChange('fees', value)} />
        <Form.HelpText tooltip>Enter the transaction fees</Form.HelpText>
      </Form.Group>
      <Form.Group style={{ marginBottom: '10px' }}>
        <Button 
          disabled = {!transferButtonState}
          appearance="primary" 
          size="sm" 
          onClick={handleTransfer}>Transfer</Button>
      </Form.Group>
    </Form>
    </>
  )
}

export default TransferForm;
/*



*/