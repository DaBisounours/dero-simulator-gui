import parse from 'html-react-parser';
import Convert from 'ansi-to-html';
import { useAtom } from 'jotai';
import { match } from 'ts-pattern';
import { SimulatorState, logAtom } from '../App';
import { useEffect, useRef, useState } from 'react';

export function LogsTab({ state, configValid, maxHeight, scrollToBottomDelay = 0 }: { state: SimulatorState, configValid: boolean, maxHeight?: string, scrollToBottomDelay?: number }) {
    const [log] = useAtom(logAtom);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

    const convert = new Convert({
        colors: {
            0: '#333',
            1: '#F44',
            2: '#3A3',
            3: '#A53',
            4: '#55F',
            5: '#A3A',
            6: '#3AA',
            7: '#AAA',
            8: '#555',
            9: '#D66',
            10: '#6E6',
            11: '#EE6',
            12: '#66E',
            13: '#E6E',
            14: '#6EE',
            15: '#DEE'
        }
    });

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            const handleScroll = () => {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
                const atBottom = scrollTop + clientHeight === scrollHeight;
                setIsScrolledToBottom(atBottom);
            };

            scrollContainer.addEventListener("scroll", handleScroll);
            return () => scrollContainer.removeEventListener("scroll", handleScroll);
        }
    }, [scrollContainerRef]);

    useEffect(() => {
        if (isScrolledToBottom) {
            const scrollContainer = scrollContainerRef.current;
            if (scrollContainer) {
                const scrollToBottom = () => {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                };

                if (scrollToBottomDelay) {
                    setTimeout(scrollToBottom, scrollToBottomDelay);
                } else {
                    scrollToBottom();
                }
            }
        }
    }, [isScrolledToBottom, scrollToBottomDelay, log, scrollContainerRef]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, []);

    const allLogs =
        <div ref={scrollContainerRef} style={{ background: "rgb(26, 29, 36)", padding: "2em", margin: '1em', borderRadius: "4px", maxHeight: maxHeight ?? "500px", overflowY: "scroll"}}>
            {log && log.map((line, l) => <div key={l}>
                {parse(convert.toHtml(line))}
            </div>)}
        </div>

    return <>
        {match(state)
            .with(SimulatorState.Stopped, _ => {

                if (configValid) {
                    if (log.length > 0) {
                        return <div style={{ textAlign: "left" }}>{allLogs}</div>
                    } else {
                        return <>Click the start button to launch the simulator!</>
                    }
                } else {
                    return <>Please go into Settings to configure the application.</>
                }
            })
            .otherwise(_ => <div style={{ textAlign: "left" }}>
                {allLogs}
            </div>)

        }
    </>
}
