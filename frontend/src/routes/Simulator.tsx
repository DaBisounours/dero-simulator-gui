import { useAtom } from "jotai"
import { configValidAtom, stateAtom } from "../App"

import { Nav, Stack } from "rsuite";

import { useState } from "react";

import { LogsTab } from "../components/LogsTab";
import { StatusTab } from "../components/StatusTab";
import { DebugTab } from "../components/DebugTab";
import { InstallSC } from "../components/InstallScTab";

function Simulator() {
    const [state] = useAtom(stateAtom)
    const [configValid] = useAtom(configValidAtom);

    /** RENDER */
    enum Tab {
        Status = 'Status',
        Logs = 'Logs',
        InstallSC = 'Install SC',
        Debug = 'Debug'
    }
    const [tab, setTab] = useState(Tab.Logs);
    const tabs: { [t in Tab]: JSX.Element } = {
        [Tab.Status]: <StatusTab state={state} configValid={configValid} />,
        [Tab.Logs]: <LogsTab state={state} configValid={configValid} />,
        [Tab.InstallSC]: <InstallSC state={state} configValid={configValid} />,
        [Tab.Debug]: <DebugTab state={state} configValid={configValid} />,
    }
    return <Stack direction="column" alignItems="flex-start">
        <Stack.Item>
            <Nav appearance="subtle" activeKey={tab} onSelect={(k: Tab) => setTab(k)} style={{ marginBottom: '1em' }}>
                {Object.keys(tabs).map((key, k) => <Nav.Item key={k} eventKey={key}>{key}</Nav.Item>)}
            </Nav>
        </Stack.Item>
        <Stack.Item style={{width: '100%'}} grow={1}>
            {tabs[tab]}
        </Stack.Item>
    </Stack>
}

export default Simulator