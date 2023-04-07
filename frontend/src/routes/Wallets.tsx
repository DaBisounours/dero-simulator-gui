import { Button, FlexboxGrid, IconButton, Stack, Tooltip, Whisper } from "rsuite"

import Nav from '@rsuite/responsive-nav';
import { useEffect, useState } from "react";
import { atom, useAtom } from "jotai";
import { appDataAtom } from "../App";
import { match } from "ts-pattern";

import CloseIcon from '@rsuite/icons/Close';
import CreditCardPlusIcon from '@rsuite/icons/CreditCardPlus';

import { WalletAction } from "../../wailsjs/go/main/App";

import TransferForm from "../components/TransferForm"

import JSONViewer from 'react-json-view';
import { formatDate, shortAddress, unitToDero } from "../utils";
import React from "react";

export const transferButtonStateAtom = atom(true)

type Wallet = {
    eventKey: string,
    label: string
}


function Wallets() {
    const [data, setData] = useAtom(appDataAtom)
    const [, setTransferButtonState] = useAtom(transferButtonStateAtom)

    var [openWallets, setOpenWallets] = useState<Wallet[]>([]);
    useEffect(() => {
        openWallets = openWallets.filter(wallet => Object.keys(data.wallets).includes(wallet.eventKey))
        setOpenWallets(openWallets);
        if (openWallets.findIndex((w) => w.eventKey == activeKey) >= 0 ) {
            //setActiveKey('status');
        }
        
    }, [data])

    


    // transfer dero to an address with parameters
    function transferClickHandler(destination: string, amount: number)  {
        // Disable Transfer button
        setTransferButtonState(false)
        const walletId = activeKey
        const method = "transfer"
        const ringsize =  2
        const transferParam = {
            "transfers": [{
                "destination": destination, // (e.g. deto1qyre7td6x9r88y4cavdgpv6k7lvx6j39lfsx420hpvh3ydpcrtxrxqg8v8e3z )
                "amount": amount
            }],
            "ringsize": ringsize
        }
    
        //console.log("[transferClickHandler] request=", walletId, method, transferParam)
        WalletAction(walletId, method, transferParam).then( (res) => {
            //console.log("[transferClickHandler] res=", res)

            // TODO better here: get the actual date of transaction from simulator log
            const date = new Date()
            const formattedDate = formatDate(date.toString())
            let logLine: string = ""
            if (res?.error) {
                // Don't need it anymore cause I'm getting the error msg from the simulator log parse in App.tsx
                //const errorMessage = res?.error?.message ?? 'dero gui error'
                //logLine = formattedDate + ' | ERROR: ' + errorMessage
                
            } else {
                const result = res?.result ?? 'dero gui error'
                logLine = formattedDate + ' | SENT txid: ' + result?.txid
                console.log(result, logLine)
            }
            
            // Save logLine to global data
            try {
                if ( logLine !== "") {
                    if (data.wallets[walletId]?.log) {
                        // @ts-ignore
                        data.wallets[walletId].log.push(logLine) 
                    } else {
                        data.wallets[walletId].log = [logLine];
                    }
                    setData(data)
                }
            } catch (error) {
                console.log("[transferClickHandler] ERROR: ", error)
            }
            
            
            setTransferButtonState(true)
        })
    }

    const [activeKey, setActiveKey] = useState<string>('status');


    const styles : Record<string, React.CSSProperties> = {
        walletButton: { margin: '0.5em', },
        container: { padding: '1em' },
        closeTab: { padding: 0, marginLeft: '.5em', background: 'none' },
        transferLog: { background: "rgb(26, 29, 36)", padding: "2em", margin: '1em', borderRadius: "4px", maxHeight: "300px", overflowY: "scroll"},
        errorLog: { background: "rgb(26, 29, 36)", padding: "2em", margin: '1em', borderRadius: "4px", maxHeight: "200px", overflowY: "scroll"},
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
                    const balanceStr = `${unitToDero(balance)}/${unitToDero(unlocked_balance)}`;
                    const transfers_entries = data.wallets[activeKey]?.transfers?.result.entries ?? {}
                    
                    //console.log("transfers_entries=", transfers_entries)
                    const transfers = transfers_entries.map( 
                        (transfer: any) => {
                            const formattedDate = formatDate(transfer?.time)
                            let label1: string = "↩ Received"
                            let label2: string = ""
                            if (transfer?.coinbase) {
                                label2 = "From Coinbase"
                            } else if (transfer?.incoming) {
                                label2 = "From " + shortAddress(transfer?.sender)
                            } else if (transfer?.incoming === false) {
                                label1 = "↪ Sent "
                                label2 = "To " + shortAddress(transfer?.destination)
                            }
                            const name = `${formattedDate} | ${label1} ${unitToDero(transfer?.amount)} DERO ${label2}`
                            return (
                                <div key={name}><JSONViewer 
                                    src={transfer} 
                                    theme="ashes" 
                                    displayDataTypes={false}
                                    displayObjectSize={false}
                                    collapsed={true}
                                    name={name} />
                                </div>
                            )
                        } 
                    )
                    
                    const viewLog = data.wallets[activeKey]?.log ?? []
                    const logs = viewLog.map(
                        (log: string, index: number) => {
                            const key = index
                            const logShortLine: React.ReactElement<{key: string}> = 
                                <div key={key}>{log?.length > 70 ? log?.slice(0, 70) + '...' : log }</div>
                            if ( log?.length > 70 ) {
                                const tooltip = (
                                    <Tooltip>
                                      {log}
                                    </Tooltip>
                                );
                                
                                return <Whisper
                                    key={key}
                                    placement="top"
                                    controlId="control-id-context-menu"
                                    trigger="hover"
                                    speaker={tooltip}>
                                        {logShortLine}
                                    </Whisper>
                            } else {
                                return logShortLine
                            }
                            
                        }
                    )
                    return (
                        <>
                        <div style={{ textAlign: "left" }}>
                            <div>Address: {address}</div>
                            <div>Balance: {balanceStr} DERO</div>
                            <div>
                                <TransferForm balance={unitToDero(balance)} transferClickHandler={transferClickHandler} />
                            </div>
                            <div>
                                <div>Transfers</div>
                                <div style={styles.transferLog}>
                                    { transfers }
                                </div>
                            </div>
                            <div>
                                <div>Log</div>
                                <div style={styles.errorLog}>
                                    { logs }
                                </div>
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


/**
 */