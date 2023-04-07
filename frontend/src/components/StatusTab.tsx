import { useAtom } from "jotai";
import { match } from "ts-pattern";
import { SimulatorState, appDataAtom, AppContextData } from "../App";
import { secondsToDHMS, formatKeys } from "../utils";

export function StatusTab({ state, configValid }: { state: SimulatorState, configValid: boolean }) {
    const [data] = useAtom(appDataAtom);

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
                const context = {...data.context}
                const uptime = secondsToDHMS(parseInt(context.uptime?.toString() ?? "0"))
                delete context.uptime
                context.uptime = uptime
                delete context.version
                delete context.testnet

                const formattedContext = formatKeys(context);

                //context.testnet
                return (<div style={{ textAlign: "left" }}>
                    {Object.keys(formattedContext).map((key: string, k) => 
                        <div key={k}>
                            {key}: {formattedContext[key as keyof AppContextData]}
                        </div>
                    )}
                    </div>
                )
            })
        }
    </div>
}