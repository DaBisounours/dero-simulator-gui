import { useAtom } from "jotai";
import { match } from "ts-pattern";
import { SimulatorState, appDataAtom, AppContextData } from "../App";
import { secondsToDHMS, formatKeys, encodeHex, decodeHex, unitToDero } from "../utils";
import FunctionForm from "./FunctionForm";
import { FunctionData, getFunctions } from "../parseSmartContract";
import { DaemonAction } from "../../wailsjs/go/main/App";

import { Form, List, Message, Panel } from "rsuite";
import { useEffect, useState } from "react";

import { SmartContractPicker } from "./SmartContractPicker"
import WalletPicker from "./WalletPicker";
import { LogsTab } from "./LogsTab";



type smartContractVarsType = {
  [key: string]: number | string;
}
export function DebugTab({ state, configValid }: { state: SimulatorState, configValid: boolean }) {
    const [appData] = useAtom(appDataAtom);
    const [smartContractVars, setSmartContractVars] = useState<smartContractVarsType>({})
    const [smartContractId, setSmartContractId] = useState("")
    const [smartContractFunctions, setSmartContractFunctions] = useState<FunctionData[]>([]);
    const [curWalletId, setCurWalletId] = useState("wallet_0")
    const [walletAmount, setWalletAmount] = useState(0)
    const [walletBalance, setWalletBalance] = useState(0)



    function getSmartContractInfo(smartContractScId: string) {
      console.log("[getSmartContractInfo] smartContractId=", smartContractScId)
      const method = "DERO.GetSC"
      const params = {
        //"scid": "b9e13c1617173b6d8aa5419bca2637014e754fd9d727b6dd727f1115cf88edaa",
        "scid": smartContractScId,
        "code": false,
        "variables": true
      }
      DaemonAction(method, params).then( (res) => {
        console.log("[getSmartContractInfo] res=", res)
        const { balance, stringkeys } = res.result;
        setWalletBalance(balance ?? 0)
        setSmartContractVars(stringkeys)
      })
    }

    
    function handleContractPicker(value: any): void {
      console.log("[handleContractPicker] value=", value)
      if (value === null) {
        setSmartContractId("")
        setSmartContractFunctions([])
        setSmartContractVars({})
      } else {
        setSmartContractId(value)
        getSmartContractInfo(appData.smartContracts[value].scid ?? "")
        setSmartContractFunctions(getFunctions(appData.smartContracts[value]?.code ?? ""))
      }
    }
    
    useEffect(() => {
      const intervalId = setInterval(() => {
        //console.warn(appData.smartContracts[smartContractId]?.scid)
        getSmartContractInfo(appData.smartContracts[smartContractId]?.scid ?? "");
      }, 3000);
  
      return () => clearInterval(intervalId);
    }, [smartContractId]);
    

    
    return <div>
      {match(state)
          .with(SimulatorState.Stopped, _ => {
              if (configValid) {
                  return <>Click the start button to launch the simulator!</>
              } else {
                  return <>Please go into Settings to configure the application.</>
              }

          })
          .otherwise(_ => {
            //console.log(smartContractId , appData.smartContracts[smartContractId]?.scid)
            return(
              <div style={{ textAlign: "left" }}>

                {/* Select smart contract */} 
                <SmartContractPicker onChange={ handleContractPicker }/>

                <Form style={{ padding: "20px 2px 0px 0px" }} layout="vertical">

                  {/* Select wallet */}
                  <Form.Group controlId="selectwalletid" style={{ display: 'inline-flex' }}>
                    <Form.ControlLabel style={{ marginRight: '5px' }}>Wallet</Form.ControlLabel>
                    <WalletPicker value={curWalletId} onChange={function (walletId: string): void {
                      if (walletId === null) {
                        walletId = "wallet_0"
                      }
                      setCurWalletId(walletId)
                    }}
                    />
                  </Form.Group>

                  {/* Select amount */}
                  <Form.Group controlId="selectamount" style={{ display: 'inline-flex', marginLeft: '10px', alignItems: 'center'  }}>
                  
                    <Form.ControlLabel style={{ marginRight: '5px', marginBottom: '0px' }}>Amount</Form.ControlLabel>
                    <Form.Control
                      style={{ width: '100px' }}
                      name="amount"
                      type="number"
                      size="xs"
                      step={0.01}
                      value={walletAmount}
                      onChange={(value) => setWalletAmount(value)}
                    />
                    <Form.HelpText tooltip>Enter the amount to transfer in DERO</Form.HelpText>
                  </Form.Group>

                </Form>
                
                {/* Smart contract info */}
                {  smartContractId === "" ? <div></div> : 
                
                (appData.smartContracts[smartContractId]?.scid ?? undefined) !== undefined && appData.smartContracts[smartContractId]?.scid !== ""  ? 
                  <div style={{ padding: '7px' }} >

                    {/* Smart contract functions */}
                    <FunctionForm walletAmount={walletAmount} walletId={curWalletId} functions={smartContractFunctions} scid={appData.smartContracts?.[smartContractId]?.scid ?? ""}/>
                    
                    {/* Smart Contract balance and vars */}
                    <Panel header="Vars">
                    <div style={{ background: "rgb(0, 0, 0)", padding: "2px", margin: '1px', borderRadius: "4px", maxHeight: "180px", overflowY: "scroll"}}>
                      <List>
                        <List.Item style={{ padding: '2px' }} key={'walletBalance876823'}>
                          <div style={{ whiteSpace: "pre" }}>
                            {"balance: " + unitToDero(walletBalance) + " \u00A0\u00A0(" + walletBalance + ")"}
                          </div>
                        </List.Item>
                        {smartContractVars && Object.keys(smartContractVars).map(key => (
                          key !== "C" && (
                            <List.Item style={{ padding: '2px' }} key={key}>
                              <div>{key}: { 
                                typeof smartContractVars[key] === 'string' 
                                ?  
                                  smartContractVars[key] as string + "\u00A0\u00A0(" + decodeHex(smartContractVars[key] as string) + ")"
                                : 
                                  smartContractVars[key]  }
                              </div>
                            </List.Item>
                          )
                        ))}
                      </List>
                    </div>
                    </Panel>
                                
                    <LogsTab state={state} configValid={configValid} maxHeight="120px"/>
                  </div> 
                    : 
                  <div style={{ padding: '15px 15px 15px 15px' }} >
                    <Message type="warning" showIcon>Smart Contract {smartContractId} not installed</Message>
                  </div>
                }
                                
              </div>
              )
          })
      }
    </div>
}


/*
<FunctionForm functions={smartContractFunctionsgetFunctions(appData.smartContracts[smartContractId]?.code ?? "")} />

*/