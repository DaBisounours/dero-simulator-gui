import { FlexboxGrid, IconButton, Stack } from "rsuite"

import Nav from '@rsuite/responsive-nav';
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { appDataAtom } from "../App";
import { match } from "ts-pattern";

import CloseIcon from '@rsuite/icons/Close';
import CreditCardPlusIcon from '@rsuite/icons/CreditCardPlus';

type Wallet = {
    eventKey: string,
    label: string
}

const DERO_UNIT = 100000

function Wallets() {
    var [data] = useAtom(appDataAtom)

    var [openWallets, setOpenWallets] = useState<Wallet[]>([]);
    useEffect(() => {
        openWallets = openWallets.filter(wallet => Object.keys(data.wallets).includes(wallet.eventKey))
        setOpenWallets(openWallets);
        if (openWallets.findIndex((w) => w.eventKey == activeKey) >= 0 ) {
            //setActiveKey('status');
        }
        
    }, [data])

    const [activeKey, setActiveKey] = useState<string>('status');


    const styles = {
        walletButton: { margin: '0.5em', },
        container: { padding: '1em' },
        closeTab: { padding: 0, marginLeft: '.5em', background: 'none' },
    }

    return <Stack direction="column" alignItems="flex-start">
        <Stack.Item>
            <Nav
                appearance="tabs"
                activeKey={activeKey}
                onSelect={(k) => k ? setActiveKey(String(k)) : null} >
                <Nav.Item eventKey="status">Status</Nav.Item>
                {openWallets.map(w => {
                    return <Nav.Item key={w.eventKey} eventKey={w.eventKey}>
                        {w.label}
                        <IconButton
                            style={styles.closeTab}
                            icon={<CloseIcon />}
                            onClick={(event) => {
                                event.stopPropagation();
                                setOpenWallets(openWallets.filter((openWallet) => openWallet.eventKey != w.eventKey))
                                setActiveKey('status');
                            }} />
                    </Nav.Item>
                })}
            </Nav>
        </Stack.Item>
        <Stack.Item>
            {match(activeKey).with('status', () => {
                return <FlexboxGrid style={styles.container}>
                    
                    {Object.keys(data.wallets).map((wallet, key) => <FlexboxGrid.Item key={key}>
                        <IconButton icon={<CreditCardPlusIcon />} style={styles.walletButton} onClick={() => {
                            // If wallet_X is not open add it to openWallets
                            if ( ! openWallets.some(item => item.eventKey === wallet) ) {
                                openWallets.push({
                                    eventKey: wallet,
                                    label: wallet[0].toUpperCase() + wallet.slice(1).replace('_', ' ')
                                })
                                setOpenWallets(openWallets)
                            }
                        }}>{wallet}</IconButton>
                    </FlexboxGrid.Item>)}
                </FlexboxGrid>
            })
            .otherwise(_ => {
                if ( !data.wallets[activeKey].hasOwnProperty("address") ) {
                    return (<div>Getting info...</div>)
                } else {
                    const address = data.wallets[activeKey]?.address ?? "Address not found"
                    const balance = data.wallets[activeKey]?.balance ?? 0;
                    const unlocked_balance = data.wallets[activeKey]?.unlocked_balance ?? 0;
                    const balanceStr = `${balance/DERO_UNIT}/${unlocked_balance/DERO_UNIT}`;
                    const transfers_entries = data.wallets[activeKey]?.transfers?.result.entries ?? {}
                    //const transfers = data.wallets[activeKey]?.transfers?.result.entries.map( (transfer: any) => <div>{<pre>{JSON.stringify(transfer, null, 2)}</pre>}</div> )
                    const transfers = transfers_entries.map( (transfer: any) => <div>{<pre>{JSON.stringify(transfer, null, 2)}</pre>}</div> )
                    return (
                        <>
                        <div style={{ textAlign: "left" }}>
                            <div>Address: {address}</div>
                            <div>Balance: {balanceStr} DERO</div>
                            <div>Transactions</div>
                            <div style={{ background: "rgb(26, 29, 36)", padding: "2em", margin: '1em', borderRadius: "4px", maxHeight: "500px", overflowY: "scroll"}}>
                                { transfers }
                                
                            
                            </div>
                        </div>
                        </>
                    )
                }
            })}
        </Stack.Item>
    </Stack>

}

export default Wallets
