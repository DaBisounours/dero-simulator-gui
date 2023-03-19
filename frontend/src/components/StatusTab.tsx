import { useAtom } from "jotai";
import { match } from "ts-pattern";
import { SimulatorState, appDataAtom, AppContextData } from "../App";

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
            .otherwise(_ => <div style={{ textAlign: "left" }}>
                {Object.keys(data.context).map((key: string, k) => <div key={k}>
                    {key}: {data.context[key as keyof AppContextData]}
                </div>
                )}
            </div>)
        }
    </div>
}