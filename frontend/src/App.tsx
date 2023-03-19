import { CSSProperties, useEffect, useState } from 'react';

import enGB from 'rsuite/locales/en_GB';
import 'rsuite/dist/rsuite.min.css';
import './App.css';
import { match } from 'ts-pattern';
import { CheckFileExists, FetchSimulatorOutput, IsSimulatorRunning, ReadConfig, StartSimulator, StopSimulator } from "../wailsjs/go/main/App";
import { Button as IconButton, Container, Content, CustomProvider, Header, Nav, Sidebar, Sidenav } from 'rsuite';

import DashboardIcon from '@rsuite/icons/legacy/Dashboard';
import GroupIcon from '@rsuite/icons/legacy/Group';
import GearCircleIcon from '@rsuite/icons/legacy/GearCircle';
import { FaPlay, FaStop } from "react-icons/fa";
import MoreIcon from '@rsuite/icons/More';
import { atom } from 'jotai/vanilla';
import { useAtom } from 'jotai/react';
import { atomWithStorage } from 'jotai/vanilla/utils';
import { atomWithImmer, useImmerAtom } from 'jotai-immer'


import { Link, Route, Switch, useLocation } from "wouter";
import Simulator from './routes/Simulator';
import Wallets from './routes/Wallets';
import Settings from './routes/Settings';
import { ErrorBoundary } from 'react-error-boundary';

export type Configuration = {
    Path: string;
}

export enum SimulatorState {
    Stopped,
    Starting,
    Stopping,
    Running,
}



export const stateAtom = atomWithStorage('state', SimulatorState.Stopped);


export type AppContextData = {
    OS?: string,
    ARCH?: string,
    GOMAXPROCS?: number,
    Version?: string,
    MODE?: string,
    "Daemon data directory"?: string
}
export type AppData = {
    context: AppContextData,
    wallets: {
        [id: string]: WalletData
    }
}
type WalletData = {
    address: string
}

const defaultData: AppData = {
    context: {},
    wallets: {}
}
export const appDataAtom = atom<AppData>(defaultData);


export const configAtom = atomWithStorage<Configuration>('config', { Path: "" });
export const configValidAtom = atom(false);

export const logAtom = atom<string[]>([]);



function App() {

    const [config, setConfig] = useAtom(configAtom);
    const [, setData] = useAtom(appDataAtom);
    const [, setLog] = useAtom(logAtom);
    var [linesParsed, setLinesParsed] = useState(0);


    /** LOAD CONFIG */
    loadConfig(setConfig)

    /** LOGIC */
    const isConfigValid = checkConfiguration(config);

    const simulatorStateButtonLabelMap: { [k in SimulatorState]: string } = {
        [SimulatorState.Stopped]: "Start",
        [SimulatorState.Starting]: "Starting...",
        [SimulatorState.Stopping]: "Stopping...",
        [SimulatorState.Running]: "Stop",
    }

    const [state, setState] = useAtom(stateAtom);
    useEffect(() => {
        IsSimulatorRunning().then((running) => running ? setState(SimulatorState.Running) : setState(SimulatorState.Stopped));
    }, [])


    const buttonLabel = simulatorStateButtonLabelMap[state];
    const buttonIcon = match(state)
        .with(SimulatorState.Running, _ => <FaStop />)
        .with(SimulatorState.Stopped, _ => <FaPlay />)
        .otherwise(_ => <MoreIcon />);

    const buttonDisabled = !isConfigValid || state == SimulatorState.Starting || state == SimulatorState.Stopping;

    function buttonClickHandler() {
        match(state)
            .with(SimulatorState.Stopped, async _ => {
                // Start the simulator
                await StartSimulator(config.Path)
                setData(defaultData)
                setLog([])
                setState(SimulatorState.Starting)

            })
            .with(SimulatorState.Running, async _ => {
                // Stop the simulator
                setState(SimulatorState.Stopping)
                await StopSimulator()
                setState(SimulatorState.Stopped)
            })
            .otherwise(_ => { })
    }

    keepFetchingLogOuptut();


    keepParsingLogOutput();


    /** RENDER */
    const [location] = useLocation();


    const styles: { [k: string]: CSSProperties } = {
        container: {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        },
        header: {
            height: '68px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 2pc',
            gap: '1pc'
        }
    }

    return <CustomProvider locale={enGB} theme="dark">
        <Container style={styles.container}>
            <Header style={styles.header}>
                <h1 style={{ fontSize: '14pt' }}>DERO Simulator</h1>
                <IconButton
                    onClick={buttonClickHandler}
                    disabled={buttonDisabled}
                    startIcon={buttonIcon}>
                    {buttonLabel}
                </IconButton>
            </Header>


            <Container>

                <Sidebar style={{
                    minWidth: '240px',
                    maxWidth: '240px'
                }}>
                    <Sidenav style={{ height: '100%' }}>
                        <Sidenav.Body>
                            <Nav activeKey={location}>
                                <Link to='/'>
                                    <Nav.Item eventKey="/" icon={<DashboardIcon />}>
                                        Simulator
                                    </Nav.Item>
                                </Link>
                                <Link to='/wallets'>
                                    <Nav.Item eventKey="/wallets" icon={<GroupIcon />}>
                                        Wallets
                                    </Nav.Item>
                                </Link>
                                <Link to='/settings'>
                                    <Nav.Item eventKey="/settings" icon={<GearCircleIcon />}>
                                        Settings
                                    </Nav.Item>
                                </Link>
                            </Nav>
                        </Sidenav.Body>
                    </Sidenav>
                </Sidebar>

                <Content style={{ padding: '2em' }}>
                    <Switch>
                        <Route path="/"><Simulator /></Route>
                        <Route path="/wallets"><Wallets /></Route>
                        <Route path="/settings"><Settings /></Route>
                    </Switch>
                </Content>
            </Container>
        </Container>
    </CustomProvider>;



    function keepFetchingLogOuptut() {

        const [state, setState] = useAtom(stateAtom);
        var [log, setLog] = useAtom(logAtom);

        useEffect(() => {
            if (state != SimulatorState.Stopped) {

                if (state == SimulatorState.Starting) {
                    setLog([]);
                }

                const interval = setInterval(async () => {
                    FetchSimulatorOutput()
                        .then((lines) => {
                            log = [...log, ...lines]
                            setLog(log)
                        })
                        .catch((err) => {
                            setState(SimulatorState.Stopped)
                        })
                }, 200)
                return () => {
                    clearInterval(interval);
                }
            } else {
                setLinesParsed(0);
            }

        }, [state])
    }

    function keepParsingLogOutput() {

        var [state, setState] = useAtom(stateAtom);
        var [data, setData] = useAtom(appDataAtom)

        const [log] = useAtom(logAtom);

        useEffect(() => {
            for (let line = linesParsed; line < log.length; line++) {
                const lineString = log[line];

                parseLine(lineString);
                setLinesParsed(++linesParsed);
            }
        }, [log])


        function parseLine(line: string) {
            const content = line
                .replace(
                    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
                    ''
                ).split('\t');

            const [date, level, location, message, jsonData, ...other] = content;
            console.log({ date, level, location, message, jsonData, other });

            if (level === 'INFO') {
                match(location)
                    .with('CORE', () => {
                        if (message == 'Initialized') {
                            state = SimulatorState.Running
                            setState(state)
                        }


                    })
                    .with('derod', () => {
                        if (jsonData && !message.startsWith('wallet')) {
                            try {
                                const parsedData = JSON.parse(jsonData);
                                console.warn({ parsedData });
                                data = { ...data, context: { ...data.context, ...parsedData } }
                                setData(data);
                            } catch (error) {
                                console.error('Failed to parse derod data');

                            }

                        }
                    })
                    .when((loc) => loc.startsWith('wallet'), (w) => {
                        if (message.toLowerCase().includes('starting')) {
                            try {
                                const parsed = JSON.parse(jsonData);
                                if (parsed && parsed.address) {
                                    const address = parsed.address;
                                    data.wallets[w] = {
                                        address
                                    }
                                    setData(data);
                                }
                            } catch (error) {
                                console.error('Failed to parse wallet data');
                            }

                        } else if (message.toLowerCase().includes('shutdown')) {
                            delete data.wallets[w];
                            setData(data);
                        }

                    })
                    .otherwise(_ => {
                        //console.warn("Line not parsed.", { date, level, location, message, data });
                    })
            }
        }

    }


}



function checkConfiguration(config: Configuration) {
    const [configValid, setConfigValid] = useAtom(configValidAtom);
    useEffect(() => {
        const action = async () => {
            const valid = config != null && config.Path != "" && await CheckFileExists(config.Path)
            // TODO reason for invalidity
            setConfigValid(valid)
        }
        action()

    }, [config])
    return configValid;
}


function loadConfig(setConfig: ((config: Configuration) => void)) {
    useEffect(() => {
        ReadConfig()
            .then((returnValues: string[]) => {
                let [config_str, isFileRead, error] = returnValues;

                if (error == "") {
                    try {
                        let c = JSON.parse(config_str) as Configuration;
                        if (c != null) {
                            setConfig(c)
                        }
                    } catch (error) {
                        console.error('Failed to parse config');

                    }

                } else {
                    console.error(error);
                }

            })

    }, [])
}



export default App
