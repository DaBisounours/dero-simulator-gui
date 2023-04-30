//
// -------------------------------
//
/*
let code = `// Copyright 2022 Civilware. All rights reserved.
// Gnomon - DERO Network Indexer (https://github.com/civilware/Gnomon)
// Usernames: Gnomon, gnomon

Function InitializePrivate() Uint64
    10  IF EXISTS("owner") == 0 THEN GOTO 30
    20  RETURN 1
    30  STORE("owner", SIGNER())
    40  STORE("signature", "")
    50  STORE("balance", 0)

    100 RETURN 0
End Function

Function InputSCID(scid String, scowner String, deployheight Uint64) Uint64
    10  IF LOAD("owner") == SIGNER() THEN GOTO 20 ELSE GOTO 100
    20  IF EXISTS(scid) == 0 THEN GOTO 30 ELSE GOTO 100
    30  IF scowner != "" THEN GOTO 40 ELSE GOTO 100
    40  IF IS_ADDRESS_VALID(ADDRESS_RAW(scowner)) == 1 THEN GOTO 50 ELSE GOTO 100

    50  STORE(scid, "")
    60  STORE(scid + "owner", ADDRESS_RAW(scowner))
    70  STORE(scid + "height", deployheight)

    100 RETURN 0
End Function

Function RemoveSCID(scid String) Uint64
    10  IF LOAD("owner") == SIGNER() THEN GOTO 20 ELSE GOTO 100
    20  IF EXISTS(scid) == 1 THEN GOTO 30 ELSE GOTO 100
    30  DELETE(scid)
    40  DELETE(scid + "owner")
    50  DELETE(scid + "height")

    100 RETURN 0
End Function

Function SetSCIDHeaders(scid String, name String, descr String, icon String) Uint64
    10  IF EXISTS(scid + "owner") == 1 THEN GOTO 20 ELSE GOTO 100
    20  IF LOAD(scid + "owner") == SIGNER() THEN GOTO 30 ELSE GOTO 100
    30  IF DEROVALUE() < 200 THEN GOTO 100
    40  STORE("balance", LOAD("balance") + DEROVALUE())
    50  STORE(scid, name + ";" + descr + ";" + icon)

    100 RETURN 0
End Function

Function Withdraw() Uint64
    10  IF LOAD("owner") == SIGNER() THEN GOTO 20 ELSE GOTO 100
    20  IF LOAD("balance") > 0 THEN GOTO 30 ELSE GOTO 100
    30  SEND_DERO_TO_ADDRESS(SIGNER(), LOAD("balance"))
    40  STORE("balance", 0)

    100 RETURN 0
End Function

Function UpdateSignature(SC_SIG String) Uint64
    10  IF LOAD("owner") == SIGNER() THEN GOTO 20 ELSE GOTO 100
    20  IF SC_SIG != "" THEN GOTO 30 ELSE GOTO 100
    30  STORE("signature", SC_SIG)

    100 RETURN 0
End Function

Function UpdateCode(SC_CODE String, SC_SIG String) Uint64 
    10  IF LOAD("owner") == SIGNER() THEN GOTO 20 ELSE GOTO 100
    20  IF SC_CODE != "" THEN GOTO 30 ELSE GOTO 100
    30  UPDATE_SC_CODE(SC_CODE)
    40  IF SC_SIG != "" THEN GOTO 50 ELSE GOTO 100
    50  STORE("signature", SC_SIG)

    100 RETURN 0
End Function
`
//
// --------------------------
//
/*


//import parse from 'html-react-parser';
//import Convert from 'ansi-to-html';


/*
export function formatCode(code: string): any {
  const convert = new Convert();
  const html = convert.toHtml(code)
  //console.warn(html)
  //return parse(code)
  return code.replace("\n", "<>")
}
*/


//const FunctionRegExp = /^[\t\f ]*Function[\t\f ]*(.*)\((.*)\)[\t\f ]*.*?[\t\f ]*(String|Uint64)[\t\f \n]+([^.$]*?)End Function/gm;
const FunctionRegExp = /^[\t\f ]*Function[\t\f ]*(.*)\((.*)\)[\t\f ]*.*?[\t\f ]*(String|Uint64)[\t\f \n]+([\s\S]*?)End Function/gm;

function getAllFunctions(s: string) {
  let matches = [];
  let match;
  while ((match = FunctionRegExp.exec(s))) {
    matches.push(match)
  }
  return matches;
}

interface Argument {
  name: string;
  type: string;
}

function parseArguments(argsStr: string): Argument[] {
  return argsStr
    .trim()
    .split(',')
    .filter(a => a.length > 0)
    .map(argsStr => {
      const argsSplit = argsStr
        .trim()
        .split(/\s+/g);

      return {
        name: argsSplit[0],
        type: argsSplit[1],
      }
    });
}



export interface FunctionData {
  code: string;
  name: string;
  returnType: string;
  args: Argument[];
}


export function getFunctions(source: string): FunctionData[] {
//function getFunctions(source: string): FunctionData[] {

  console.warn("[getFunctions] source=", source);

  const functionMatches = getAllFunctions(source);

  console.log("[getFunctions] functionMatches=", functionMatches)

  if (functionMatches?.length == 0) {
    //console.warn("[getFunctions]: No matches for ", source);
  }

  const functions: FunctionData[] = functionMatches.map(match => {
    const [code, name, argsStr, returnType, statementsStr] = match;

    const args = parseArguments(argsStr);

    return {
      code,
      name,
      returnType,
      args,
    }

  })
  //console.dir(functions, { depth: null })
  return functions
  //return []

}

//export {}
//getFunctions(code)






