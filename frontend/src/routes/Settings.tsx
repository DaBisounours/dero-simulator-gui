import { useAtom } from "jotai";
import { useState } from "react";
import { Button, ButtonToolbar, Stack, IconButton, Divider, FlexboxGrid } from "rsuite"
import { OpenFile, WriteConfig } from "../../wailsjs/go/main/App";
import { configAtom, Configuration } from "../App";
import CheckIcon from '@rsuite/icons/legacy/Check';
import { useLocation } from "wouter";

function Settings() {
    const [config, setConfig] = useAtom(configAtom);
    const [file, setFile] = useState(config?.Path || "");
    const [, setLocation] = useLocation()

    function setSimulatorPathButtonHandler() {
        OpenFile().then((path: string) => {
            if (path == '') {
                console.error("Open file browser failed.");
            } else {
                setFile(path)
            }
            
        })
    }

    function saveConfigButtonHandler() {
        const newConfig: Configuration = {
            Path: file
        }
        setConfig(newConfig)

        WriteConfig(JSON.stringify(newConfig)).then(() => {

            console.log("Config saved.", { config: newConfig })

            setLocation('/')
        }).catch((err) => {
            console.error(err)
        })
    }

    const styles: { [x: string]: React.CSSProperties } = {
        item: {
            width: '100%',
            textAlign: 'left',
        }
    }

    return (

        <Stack
            direction="column"
            justifyContent="space-between"
            alignItems="flex-start"
            style={{ height: "100%" }}
        >

            <Stack.Item>
                <Stack direction="column" alignItems="flex-start" spacing={16}>
                    <Stack.Item style={styles.item}>
                        <h3>Locate Executable</h3>
                    </Stack.Item>
                    <Stack.Item style={styles.item}>
                        This application is a wrapper around the simulator. You need to download the DERO executables (binaries) for your platform. Navigate to <a href='https://github.com/deroproject/derohe/releases'>https://github.com/deroproject/derohe/releases</a> to get them (e.g. if you are on Windows, get the <b>dero_windows_amd64.zip</b> file). <br /> Uncompress the files to the location of your liking. Then click on the following button and navigate to the location where you extracted the files. Select the executable starting with <b>simulator-...</b> .
                    </Stack.Item>
                    <Stack.Item>
                        <FlexboxGrid align="middle" justify="start" style={{ gap: '1em' }}>
                            <FlexboxGrid.Item>
                                <Button onClick={setSimulatorPathButtonHandler}>
                                    Set Simulator Path
                                </Button>
                            </FlexboxGrid.Item>

                            <FlexboxGrid.Item>
                                Current path : "{file}"
                            </FlexboxGrid.Item>
                        </FlexboxGrid>
                    </Stack.Item>

                    <Stack.Item style={styles.item}>
                        You can then click the Save Config button below!
                    </Stack.Item>
                    <Stack.Item style={styles.item}>
                        <Divider />
                    </Stack.Item>
                </Stack>
            </Stack.Item>
            <Stack.Item alignSelf="flex-end">
                <ButtonToolbar >
                    <IconButton
                        placement="right"
                        icon={<CheckIcon />}
                        children="Save Config"
                        onClick={saveConfigButtonHandler}
                    />
                </ButtonToolbar>
            </Stack.Item>
        </Stack>

    )
}

export default Settings