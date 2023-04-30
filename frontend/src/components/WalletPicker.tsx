import React from 'react';
import { InputPicker } from 'rsuite';
import { appDataAtom } from '../App';
import { useAtom } from 'jotai';
import { shortAddress } from '../utils';

type WalletListProps = {
  value: string;
  onChange: (value: string) => void;
}

const WalletPicker: React.FC<WalletListProps> = ({ value, onChange }) => {
  const [appData] = useAtom(appDataAtom);

  // Get an array of wallet IDs
  const walletIds = Object.keys(appData.wallets);

  // Map over the wallet IDs and render some information about each wallet
  const walletListInput = walletIds.map((walletId) => {
    const walletData = appData.wallets[walletId];
    const label = 'w' + walletId.slice(6).padEnd(4, ' ') + '' + shortAddress(walletData.address ?? '')
    //return { label: label, value: walletId + '|' + walletData.address}
    return { label: label, value: walletId}
  });

  return (
    <InputPicker 
      name="addressToPicker" 
      size="xs" 
      style={{ marginLeft: '4px', width: 80 }} 
      data={walletListInput} 
      value={value}  
      onChange={onChange}
    />
  );
};

export default WalletPicker;

/*
style={{ marginLeft: '4px', width: 80 }} 
*/