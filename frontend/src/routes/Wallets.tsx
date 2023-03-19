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


function Wallets() {
    var [data] = useAtom(appDataAtom)

    var [openWallets, setOpenWallets] = useState<Wallet[]>([]);
    useEffect(() => {
        openWallets = openWallets.filter(wallet => Object.keys(data.wallets).includes(wallet.eventKey))
        setOpenWallets(openWallets);
        if (openWallets.findIndex((w) => w.eventKey == activeKey) >= 0 ) {
            setActiveKey('status');
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
                            openWallets.push({
                                eventKey: wallet,
                                label: wallet[0].toUpperCase() + wallet.slice(1).replace('_', ' ')
                            })
                            setOpenWallets(openWallets)
                        }}>{wallet}</IconButton>
                    </FlexboxGrid.Item>)}
                </FlexboxGrid>
            })
                .otherwise(_ => {
                    return <div>Wallet actions are coming soon...</div>
                })}
        </Stack.Item>
    </Stack>

}

export default Wallets