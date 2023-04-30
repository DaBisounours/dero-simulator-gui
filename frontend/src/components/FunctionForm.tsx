import React, { CSSProperties, useState } from 'react';
import { Form, Button, Whisper, Popover, IconButton, Tooltip, Message } from 'rsuite';

import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { WalletAction } from '../../wailsjs/go/main/App';
import { deroToUnit, formatDate } from '../utils';


type FunctionData = {
    code: string;
    name: string;
    returnType: string;
    args: {
      name: string;
      type: string;
    }[];
}
// Define the props for the component
type FunctionFormProps = {
  walletAmount: number;
  walletId: string;
  functions: FunctionData[];
  scid: string;
  //onSubmit: (checkStatus: boolean, event: React.FormEvent<HTMLFormElement>) => void;
};

type FormValues = {
  [key: string]: string | number;
};

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
  }, 
  formFunction: {
    paddingBottom: '20px',
  },
  formFunctionArg: {
    paddingTop: '10px',
    paddingLeft: '20px',
  },
  formFunctionArgLabel: {
    marginBottom: '1px',
  },
  formFunctionTooltip: {
    whiteSpace: "pre-wrap", maxWidth: 'none',    width: 'auto', 
  },
  executeButtonResError: {
    marginBottom: "0px",
    color: "red",
    //backgroundColor: "#1a1d24",
    display: 'inline'
    //color: "white", 
    //backgroundColor: "red"
  },
  executeButtonResWarning: {
    marginBottom: "0px",
    color: "yellow",
    //backgroundColor: "#1a1d24",
    display: 'inline'
    //color: "black", 
    //backgroundColor: "yellow"
  },
  executeButtonResInfo: {
    marginBottom: "0px",
    color: "#34c3ff",
    //backgroundColor: "#1a1d24",
    display: 'inline'
    //color: "white", 
    //backgroundColor: "blue"
  }

}




// Define the component
//const FunctionForm: React.FC<FunctionFormProps> = ({ functions, onSubmit }) => {
const FunctionForm: React.FC<FunctionFormProps> = ({ walletAmount, walletId, functions, scid }) => {
  // Create a state to hold the values of the form inputs
  const [formValues, setFormValues] = useState<FormValues>({});
  const [executeButtonDisabled, setExecuteButtonDisabled] = useState(false)
  const [executeButtonRes, setExecuteButtonRes] = useState("")
  const [executeButtonResStyle, setExecuteButtonResStyle] = useState(styles.executeButtonResInfo)

  // Handle changes to the form inputs
  const handleChange = (value: any, argName: string, funcName: string) => {
    setFormValues((prevValues) => {
      return { ...prevValues, [`${funcName}-${argName}`]: value };
    });
  };

  const handleClick = (funcName: string) => {
    setExecuteButtonResStyle(styles.executeButtonResWarning)
    setExecuteButtonRes("Executing Function " + funcName + " ...")

    //console.warn(funcName, 'clicked!', formValues)
    console.log("[FunctionForm.tsx] functions=", functions)
    const funcArgs = Object.entries(formValues)
    .filter(([key]) => key.startsWith( funcName + "-"))
    .reduce((acc, [key, value]) => {
      const property = key.split("-")[1];
      //acc[property] = typeof value === "number" ? parseFloat(value.toString()) : value;
      acc[property] = value;
      
      return acc;
    }, {} as { [key: string]: string | number });
    
    console.log("[FunctionForm.tsx] funcName=", funcName, "funcArgs=", funcArgs)

    type FunctionArg = Record<string, string>;

    const getFunctionArgsType = (functionName: string, functions: FunctionData[]) => {
      const functionData = functions.find((f) => f.name === functionName);
      if (!functionData) {
        return undefined;
      }
    
      return functionData.args.reduce((acc: FunctionArg, arg) => {
        return {
          ...acc,
          [arg.name]: arg.type === "Uint64" ? "U" : "S" ,
        };
      }, {});
    };
    
    const functionArgsType = getFunctionArgsType(funcName, functions)
    

    // SCINVOKE

    // Disable Transfer button
    setExecuteButtonDisabled(true)
    
    //const walletId = "wallet_0";
    //const id = "1";
    const method = "scinvoke";
    //const scid = "8faca9f31a16aa890e13efedaaf4863ad1434435bc7982ff9bdea247df8c7fe9";
    const ringsize = 2;
    const sc_rpc = [
      {
        "name": "entrypoint",
        "datatype": "S",
        "value": funcName
      },
      ...Object.entries(funcArgs).map(([key, value]) => ({
        "name": key,
        "datatype": functionArgsType?.[key] ?? "",
        //"value": Number(value) ?? value
        "value": functionArgsType?.[key] === "U" ? Number(value) : value
      }))
      
    ];
    const params = {
      "scid": scid,
      "sc_dero_deposit": deroToUnit(walletAmount),
      //"sc_dero_deposit": deroToUnit(0.3),
      "ringsize": ringsize,
      "sc_rpc": sc_rpc
    };
    console.log("[FunctionForm.tsx] params=", params)
    WalletAction(walletId, method, params).then( (res) => {
      console.log("[FunctionForm.tsx] res=", res)

      // TODO better here: get the actual date of transaction from simulator log
      const date = new Date()
      const formattedDate = formatDate(date.toString())
      let logLine: string = ""
      if (res?.error) {
          // Don't need it anymore cause I'm getting the error msg from the simulator log parse in App.tsx
          const errorMessage = res?.error?.message ?? 'dero gui error'
          logLine = formattedDate + ' | ERROR: ' + errorMessage
          setExecuteButtonResStyle(styles.executeButtonResError)
          //setExecuteButtonRes(res?.error)

      } else {
          const result = res?.result ?? 'dero gui error'
          logLine = formattedDate + ' | SENT txid: ' + result?.txid
          console.log(result, logLine)
          setExecuteButtonResStyle(styles.executeButtonResInfo)
      }
      setExecuteButtonRes(logLine)
      setExecuteButtonDisabled(false)

      // Save logLine to global data
      /*
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
          console.log("[FunctionForm.tsx] ERROR: ", error)
      }
      */
      
      //setTransferButtonState(true)
    })

  }


  
  function formatCodeAsHtml(code: string): JSX.Element[] {
    const lines = code.split('\n');
  
    return lines.map((line, index) => (
      <div style={{ textAlign: "left" }} key={index}>
        {line}
        <br />
      </div>
    ));
  }
  

  // Generate the form inputs for each function and its args
  const inputGroups = functions.map((func) => {
    const formattedCode = formatCodeAsHtml(func.code);

    const speaker = (
      <Popover title="" style={styles.formFunctionTooltip}>
        <code>{formattedCode}</code>
      </Popover>
    );
    //let buttonDisabled = false
    //if (func.name.toLowerCase() === "initialize" || func.name.toLowerCase() === "initializeprivate") {
    //  buttonDisabled = true
    //}
    const funcExecuteButton = (
      <>
        <Button disabled={executeButtonDisabled} color="blue" size="sm" appearance="primary" onClick={() => handleClick(func.name)}>
            {`${func.name} (${func.returnType})`}
        </Button>
        <Whisper
          preventOverflow
          trigger="hover"
          controlId="control-id-container"
          speaker={speaker}
          placement="auto"
        >
          <IconButton size="xs" icon={<AddOutlineIcon />} appearance="link" />
        </Whisper>
        
      </>

    )
    const argInputs = func.args.map((arg) => {
      const controlLabel = (<Form.ControlLabel  style={styles.formFunctionArgLabel}>
        {`${arg.name} (${arg.type})`}
      </Form.ControlLabel>)

      // Check function arg type
      let controlType: string = "";
      switch(arg.type) {
        case 'String':
          controlType='text'
          break
        case 'Uint64':
          controlType='number'
          break
        default: 
          break
      }
      // TODO: make another option to have only one input field for all the func args, separated by ',' . The string args should be quoted ""
      if (true) 
        return (
          <div key={`${func.name}-${arg.name}-fragment`} style={styles.formFunctionArg}>
            {controlLabel}
            <Form.Control
              size="xs"
              type={controlType}
              name={`${func.name}-${arg.name}`}
              key={`${func.name}-${arg.name}`}
              onChange={(value) => handleChange(value, arg.name, func.name)}
            />
          </div>
        );
      
    });

    // Create the form group for the function and its args
    return (
      
      <Form key={`${func.name}-group`} style={styles.formFunction}>
      <Form.Group controlId={`${func.name}`} key={func.name}>
        {funcExecuteButton}
        {argInputs}
      </Form.Group>
      </Form>
    );
  });

  return (
    <>
      <div>Functions {"\u00A0\u00A0\u00A0\u00A0\u00A0"}Cmd status:{"\u00A0\u00A0"}
      { executeButtonRes !== "" ?
          <div style={ executeButtonResStyle }>{executeButtonRes}</div>
        : 
          <div></div>
      }
      
      </div>
      <div style={{ background: "rgb(26, 29, 36)", padding: "10px", margin: '1px', borderRadius: "4px", maxHeight: "200px", overflowY: "scroll"}}>
        {inputGroups}
      </div>
      
    </>
  );
};

export default FunctionForm;




/** 
<Form.ControlLabel>{`${func.name} (${func.returnType})`}</Form.ControlLabel>
<Form layout="inline" key={`${func.name}-group`}>

<Form.HelpText tooltip style={style_test }><code >{formattedCode}</code></Form.HelpText>
*/
