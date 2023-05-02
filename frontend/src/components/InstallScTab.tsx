import React, { useEffect, useMemo, useState } from "react";
import { HTMLAttributes } from "react";
import { useAtom } from "jotai";
import { match } from "ts-pattern";
import { SimulatorState, appDataAtom, AppContextData, AppData, SmartContractData } from "../App";
import { Form, SelectPicker, Button, Input, IconButton, Message } from "rsuite";
import { InstallSmartContract } from "../../wailsjs/go/main/App";


import { AiOutlineClear } from "react-icons/ai";
import { FormControlBaseProps } from "rsuite/esm/@types/common";
import WalletPicker from "./WalletPicker";
import { LogsTab } from "./LogsTab";

import { parse } from 'dvm-utils';


// Texarea
const Textarea = React.forwardRef<HTMLTextAreaElement>((props, ref) => (
  <Input style={{ width: "100%" }} {...props} as="textarea" ref={ref} />
));

//let allSmartContracts: SmartContractData[]

export function InstallSC({ state, configValid, }: { state: SimulatorState; configValid: boolean; }) {
  // code is the smart contract source code for textarea
  const [code, setCode] = useState("");
  const [codeValidity, setCodeValidity] = useState<null | 'ok' | string>(null);
  const [curScId, setCurScId] = useState("")
  const [appData, setAppData] = useAtom(appDataAtom)
  const [curWalletId, setCurWalletId] = useState("wallet_0")
  const [installSCButtonState, setInstallSCButtonState] = useState(true)
  const [allSmartContracts, setAllSmartContracts] = useState<SmartContractData[]>([])

  const handleSelectChange = (value: any) => {
    console.warn("[handleSelectChange] value=", value)
    let curCode: string
    let scId: string
    if (value === null) {
      curCode = ""
      scId = ""
    } else {
      [scId, curCode] = value?.split("|").map((part: string) => part.trim());
    }
    console.log("[handleSelectChange] [scId, curCode]=", [scId, curCode])
    setCode(curCode)
    setCurScId(scId)
  };


  // handle installation of smart contract
  const handleInstallSC = () => {
    console.log("[handleInstallSC] Installing smart contract with code: ", code);
    console.log("[handleInstallSC] curWalletId=", curWalletId);
    const walletId = curWalletId
    setInstallSCButtonState(false)
    InstallSmartContract(walletId, code).then((res) => {
      console.log("[handleInstallSC] res=", res)
      const txid = res?.txid ?? ""
      if (txid !== "") {
        console.log(`curScId=${curScId} txid=${txid}`)
        setAppData((prevData: AppData) => ({
          ...prevData,
          smartContracts: {
            ...appData.smartContracts,
            [curScId]: { ...appData.smartContracts[curScId], code: code, scid: txid }
          }
        }));
        setInstallSCButtonState(true)
      }
    }).catch((err) => {
      console.warn(err)
      setInstallSCButtonState(true)
    })

  };

  useCodeCheck(code, setCodeValidity)

  return <div>
    {match(state)
      .with(SimulatorState.Stopped, _ => {
        //console.warn("Stopped")
        if (configValid) {
          return <>Click the start button to launch the simulator!</>
        } else {
          return <>Please go into Settings to configure the application.</>
        }
      })
      .otherwise(_ => {
        return (
          <div style={{ textAlign: "left" }}>
            <Form>
              <Form.Group controlId="selectpicker">
                <Form.ControlLabel>Select Smart Contract</Form.ControlLabel>
                <SelectPicker
                  data={appData.smartContracts && Object.keys(appData.smartContracts).map((key) => ({
                    dataKey: key,
                    label: key,
                    value: key + '|' + appData.smartContracts[key].code, // Uncomment and set the desired value property
                  }))}
                  style={{ width: 224 }}
                  searchable={true}
                  onChange={handleSelectChange}
                />
              </Form.Group>

              <Form.Group controlId="textarea">
                <Form.ControlLabel>
                  Smart Contract Source Code &nbsp;&nbsp;&nbsp;
                </Form.ControlLabel>

                <Form.Control
                  //style={{ resize: "both"}}
                  style={{ width: "700px", height: "250px", resize: "both" }}
                  //rows={10}
                  name="textarea"
                  value={code}
                  accepter={Textarea}
                  //inputRef={textareaRef}
                  onChange={(value) => setCode(value)}
                />
                {codeValidity != null
                  ? <Message type={codeValidity == 'ok' ? "success" : "error"}>
                    {codeValidity == 'ok'
                      ? 'Code is valid'
                      : 'Error: ' + codeValidity}
                  </Message>
                  : <></>}
              </Form.Group>
              <Form.Group controlId="installSmartContract">
                <Form.ControlLabel style={{ marginBottom: "0px" }}>Wallet</Form.ControlLabel>
                <WalletPicker value={curWalletId} onChange={function (walletId: string): void {

                  if (walletId === null) {
                    walletId = "wallet_0"
                  } //else {
                  //[walletId, walletAddress] = value.split('|')
                  //}
                  setCurWalletId(walletId)
                }} />
                <Button style={{ marginLeft: "10px" }} disabled={!installSCButtonState} size="sm" appearance="primary" onClick={handleInstallSC}>Install Smart Contract</Button>
              </Form.Group>
            </Form>
            <LogsTab state={state} configValid={configValid} maxHeight="120px" />
          </div>
        );
      })
    }
  </div>

}

function useCodeCheck(code: string, setCodeValidity: React.Dispatch<React.SetStateAction<string | null>>) {
  useEffect(() => {
    try {
      const result = parse(code);
      if (result.functions.length == 0) {
        setCodeValidity('No functions parsed or syntax error.')
      } else {
        setCodeValidity('ok');
      }
    } catch (error) {
      setCodeValidity(String(error))
    }

  }, [code])
}


/*

<IconButton size="xs" appearance="primary" color="yellow" onClick={handleClearTextarea} icon={<AiOutlineClear />} />

<Button onClick={handleClearTextarea}>Clear</Button>

type FormControlProps<
  ValueType = any,
  NameType = any
> = Omit<FormControlBaseProps, "name"> &
  HTMLAttributes<HTMLElement> & {
    accepter?: React.ForwardRefExoticComponent<
      React.RefAttributes<ValueType>
    >;
    name?: NameType;
  };



  const textareaRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (textareaRef.current) {
        //textareaRef.current.style.width = `${window.innerWidth}px`;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
//console.warn(allSmartContracts?.length)
  // Get all smart contracts
  //if (allSmartContracts?.length === 0) {
    //allSmartContracts = useMemo(() => getAllSmartContracts(appData), [appData.smartContracts]);
    //allSmartContracts = getAllSmartContracts(appData)
    //console.log("HERE")
    //setAllSmartContracts(getAllSmartContracts(appData))
  //}
  //const allSmartContracts = getAllSmartContracts(appData)

  function getAllSmartContracts(appData: AppData): SmartContractData[] {
    const smartContracts: SmartContractData[] = [];
    const regex = /^\d+\|/; // regular expression to match "0|code" format
    console.warn("[getAllSmartContracts] appData.smartContracts=", appData.smartContracts)
    for (const key in appData.smartContracts) {
      if (appData.smartContracts.hasOwnProperty(key)) {
        const smartContract = appData.smartContracts[key];
        if (smartContract) {
          // Check if smartContract.code matches the desired format
          if (!regex.test(smartContract.code ?? "")) {
            //console.warn("[getAllSmartContracts] key=", key)  
            smartContract.code = key + '|' + smartContract.code
          }

          // Insert key into smartContract.code for SelectPicker
          //smartContract.code = key + '|' + smartContract.code
          //console.warn("[getAllSmartContracts] smartContract.code=", smartContract.code)
          smartContracts.push(smartContract);
          
        }
      }
    }
    return smartContracts;
  }

*/