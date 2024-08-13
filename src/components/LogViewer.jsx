import { useEffect, useState, createRef } from "react";
import PropTypes from "prop-types";

import { IoReloadOutline, IoDownload, IoSave, IoFilter, IoCloudUpload } from "react-icons/io5";
import { RiDeleteBin6Line, RiUpload2Fill } from "react-icons/ri";
import lodash from 'lodash';

// import { TabView, TabPanel } from "primereact/tabview";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import ReactJson from "@microlink/react-json-view";
import { Modal } from "react-overlays";
// import { classNames } from "primereact/utils";


function LogViewer({
    traceLogs: pTraceLogs,
    currentTime: pCurrentTime,
    currentEventIndex: pCurrentEventIndex,
    autoScroll: pautoScroll,
    playerGoTo,
    onShowFilterModal,
    onUpload,
    onSelectEvent,
    //   scoringResults,
    //   taskStates,
    // cbaFrame,
    className,
}) {

    const [autoscroll, setAutoscroll] = useState(typeof pautoScroll === 'boolean' ? pautoScroll : true);
    const [selectedPayload, setSelectedPayload] = useState({});
    const [selectedRow, setSelectedRow] = useState(0);

    const logScroller = createRef();
    const currentLog = createRef();
    const currentTimeRounded = Math.ceil(pCurrentTime*100000/100);

    useEffect(() => {
        if (autoscroll && currentLog.current)
            currentLog.current?.scrollIntoView(false, { behavior: "smooth", block: "end"});
    }, [pCurrentTime, autoscroll]);

    useEffect(() => {
        setAutoscroll(pautoScroll);
    }, [pautoScroll]);

    useEffect(() => {
        setSelectedRow(pCurrentEventIndex);
    }, [pTraceLogs]);

    const handleAutoscroll = () => {
        setAutoscroll(!autoscroll);
    };

    const setSelected = (i) => {
        setSelectedRow(i);
        setSelectedPayload(pTraceLogs[i].payload);
        if(typeof onSelectEvent === 'function'){
            onSelectEvent(pTraceLogs[i]);
        }
        if(typeof playerGoTo === 'function'){
            playerGoTo(pTraceLogs[i].relativeTime / 1000);
            // setAutoscroll(false);
        }
    }

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    }


    const renderTracelog = ({ index, name, timestamp, relativeTime }, i) => {

        const classIsFuture = pCurrentEventIndex != i && relativeTime > currentTimeRounded ? "text-gray-400" : "";
        const classIsCurrent = pCurrentEventIndex == i ? "bg-green-300" : "";
        const classIsSelected = selectedRow == i ? "bg-green-400 font-bold" : "hover:bg-blue-200";
        const currentRef = pCurrentEventIndex == i ? currentLog : null;

        return (
                <tr ref={currentRef} onClick={(e) => setSelected(i)} key={i} className={`cursor-pointer transition-colors ${classIsCurrent} ${classIsFuture} ${classIsSelected}`}>
                    <td className={`px-3 py-1 text-center`}>
                        {index}
                    </td>
                    <td className={`px-3 py-1 text-center`}>
                        {name}
                    </td>
                    <td className={`px-3 py-1 text-center`}>
                        <div className="">{timestamp}</div>
                        {/* <div className="text-xs">{formatTime(timestamp)}</div> */}
                    </td>
                    <td className={`px-3 py-1 text-center`}>
                        {relativeTime}
                    </td>
                </tr>
        );
    };


    const JsonViewer = function ({ payload, dimensions }) {
        return (
            <div className={`flex flex-col gap-2`}>
                <div className="h-7 px-2 bg-black text-white text-sm font-bold flex items-center">
                    {(selectedRow && pTraceLogs[selectedRow] && pTraceLogs[selectedRow].name) ? <span>#{pTraceLogs[selectedRow].index} - {pTraceLogs[selectedRow].name}</span>: <span>no event selected</span>}
                    {/* {dimensions && <span className="ml-auto">{dimensions.width} x {dimensions.height}</span>} */}
                </div>
                <div style={{maxHeight: `${Math.floor(dimensions.height)-30}px`}} className={`overflow-y-scroll overflow-x-hidden w-full`}>
                    <ReactJson src={payload} />
                </div>
            </div>
        );
    }  

    return (
        <>
            <ReflexContainer orientation="horizontal" className="max-h-screen">
                <ReflexElement className="h-7 bg-black"
                    maxSize={28}
                >
                    <div className="flex items-center gap-x-4 px-2 bg-black text-white text-sm font-bold align-middle h-full">
                        <span>{currentTimeRounded/1000}s</span>
                        <span>#{pCurrentEventIndex}</span>
                        <label>
                            <input
                                type="checkbox"
                                name="autoscroll"
                                id="autoscroll"
                                checked={autoscroll}
                                onChange={handleAutoscroll}
                                className="mr-2"
                            ></input>
                            autoscroll
                        </label>
                        <div className="flex-1 flex justify-end gap-x-4 items-center">
                            <span
                                className="text-white cursor-pointer"
                                onClick={() => {if(typeof onShowFilterModal === 'function') onShowFilterModal()}}
                            >
                                <IoFilter />
                            </span>
                            <span onClick={(e) => {if (typeof onUpload == "function") onUpload(e) }} className="text-white cursor-pointer">
                                <RiUpload2Fill />
                            </span>                            
                        </div>
                        {/* <span>{pCurrentTime}</span> */}
                    </div>
                </ReflexElement>
                {/* <ReflexSplitter
                    className="flex items-center mx-2"
                ></ReflexSplitter> */}
                <ReflexElement
                    propagateDimensions={true}
                    propagateDimensionsRate={500}
                    flex={0.6}
                    className="upper-pane"
                    style={{ overflow: "clip" }}
                >
                    <div
                        className="flex flex-col h-full"
                    >
                            <div className="flex-grow overflow-y-auto max-h-full"
                                ref={logScroller}
                                id="logscroller"
                            >
                                <table className="relative w-full border text-sm">
                                    <thead className="">
                                        <tr className="border-b border-white">
                                            <th className="sticky top-0 px-3 py-1 text-blue-900 bg-gray-300">#</th>
                                            <th className="sticky top-0 px-3 py-1 text-blue-900 bg-gray-300">name</th>
                                            <th className="sticky top-0 px-3 py-1 text-blue-900 bg-gray-300">timestamp</th>
                                            <th className="sticky top-0 px-3 py-1 text-blue-900 bg-gray-300">time (ms)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y bg-slate-100">
                                        {!!pTraceLogs && pTraceLogs.map((v, i) => {return renderTracelog(v, i)})}
                                        {/* <tr key="end-of-log" id="end-of-log">
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                        </tr> */}
                                        {/* <a key="end-of-log" id="end-of-log" ref={endOfLog} /> */}
                                    </tbody>
                                </table>
                            </div>
                    </div>
                </ReflexElement>
                <ReflexSplitter
                    className="flex items-center"
                    style={{ height: "10px" }}
                ></ReflexSplitter>
                <ReflexElement style={{overflowY: "hidden"}} className="lower-pane" propagateDimensionsRate={200} propagateDimensions={true}>
                    <JsonViewer payload={selectedPayload} />
                </ReflexElement>
            </ReflexContainer>
        </>
    );
}

LogViewer.propTypes = {
    traceLogs: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
            relativeTime: PropTypes.number,
            timestamp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            payload: PropTypes.object,
        })
    ),
    currentTime: PropTypes.number
};

export default LogViewer;



// <ReflexContainer orientation="vertical">
// <ReflexElement
//   propagateDimensions={true}
//   propagateDimensionsRate={500}
//   flex={0.8}
//   className="left-pane max-h-screen"
//   style={{ overflow: "hidden" }}
// >
//   {/* <CbaFrame url={url} itemDimensions={{width: itemWidth, height: itemHeight}} ref={CbaFrameRef} /> */}
//   <Player
//     ref={player}
//     src={url}
//   >
//     {/* <source src={url} /> */}
//     <ControlBar autoHide={false} />
//   </Player>

// </ReflexElement>

// <ReflexSplitter
//   className="flex items-center mx-2"
//   style={{ width: "10px" }}
// ></ReflexSplitter>

// <ReflexElement className="right-pane">
//   {/* <LogViewer className={`py-2`} traceLogs={traceLogs} scoringResults={scoringResults} taskStates={taskStates} cbaFrame={CbaFrameRef} /> */}
//   <LogViewer currentTime={playerState?.currentTime ?? 0} traceLogs={normalizedEventsFiltered} className={`py-2`} />
// </ReflexElement>
// </ReflexContainer>