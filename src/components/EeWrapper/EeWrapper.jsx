import { useEffect, useState, createRef, useRef } from "react";
import PropTypes from "prop-types";
import urlPropType from "url-prop-type";
import useWindowDimensions from "src/hooks/useWindowDimensions";

import { Player, ControlBar } from 'video-react';
import 'video-react/dist/video-react.css';

// import { Splitter, SplitterPanel } from "primereact/splitter";

import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";

import "react-reflex/styles.css";
import LogViewer from "../LogViewer";
import CustomControlBar from "../PlayerCustomControlbar";
import { Modal } from "react-overlays";
import { set } from "lodash";

function EeWrapper({ timeFrame, events, meta, url, offset, onUpload }) {

  const windowDimensions = useWindowDimensions();
  const [playerState, setPlayerState] = useState(null);  
  // const [offset, setOffset] = useState(0);  
  const [normalizedEvents, setNormalizedEvents] = useState([]);
  const [normalizedEventsFiltered, setNormalizedEventsFiltered] = useState([]);
  const [controlbarMarkers, setControlbarMarkers] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [logviewerAutoScroll, setLogviewerAutoScroll] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState({});

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filter, setFilter] = useState([]);
  const [filterOptions, setFilterOptions] = useState([]);

  const player = createRef();
  const eventsRef = useRef(normalizedEventsFiltered);
  
  const handleStateChange = (state, prevState) => {
    // copy player state to this component's state
    setPlayerState(state);

    if(state.paused == false && prevState.paused == true){
      setLogviewerAutoScroll(true);
    }

    if(eventsRef?.current?.length && Math.abs(state.currentTime - prevState.currentTime)>=0.2){
      let tmp = eventsRef?.current?.filter(e => e.relativeTime <= Math.ceil(state.currentTime*100000/100));
      setCurrentEventIndex(tmp.length-1);
    }
  }

  const handleSetSelectedEvent = (e) => {    
    if(Array.isArray(meta)){
      let tmp = meta.find(m => m.name === e.name);
      if(tmp && tmp.description){
        setSelectedEvent({...e, description: tmp.description});
        return;
      }
    }
    setSelectedEvent({...e, description: ""});
  }

  const PlayerGoTo = (time) => {
    player.current.pause();
    player.current.seek(time);
    setLogviewerAutoScroll(false);
  }

  useEffect(() => {
    
    if(Array.isArray(events) && events.length>0){
      let tmp = events
      .map((e,i) => {
        e.relativeTime = e.timestamp - timeFrame.ts_video_start + parseInt(offset);
        e.index = i;
        return e;
      })
      .filter(e => e.relativeTime >= 0 && e.timestamp >= timeFrame.ts_video_start && e.timestamp <= timeFrame.ts_end);

      setNormalizedEvents(tmp);
      setNormalizedEventsFiltered(tmp);
      setFilterOptions(tmp.map((v, i) => v.name).filter((v, i, a) => a.indexOf(v) === i));
      setControlbarMarkers(tmp.map(e => { return {time: e.relativeTime/1000, text: e.name} }));
      // console.log('events', tmp.length);
    }
    if(!!player.current){
      player.current.subscribeToStateChange(handleStateChange);
    }

    return () => {
      player?.current?.subscribeToStateChange(null);
    }
  }, [timeFrame, events])


  useEffect(() => {
    let tmp = normalizedEvents.map(e => e);
    if(filter.length && filter.length < filterOptions.length){
      tmp = normalizedEvents.filter(e => filter.includes(e.name));
    }
    if(tmp.length && player.current){
      setNormalizedEventsFiltered(tmp);
      setControlbarMarkers(tmp.map(e => { return {time: e.relativeTime/1000, text: e.name} }));
      // console.log('filter', filter, tmp.length);
    }
  } , [filter]);


  useEffect(() => {
    eventsRef.current = normalizedEventsFiltered;
  }, [normalizedEventsFiltered]);

  const backdrop = (props) => (
    <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
        onClick={() => setShowFilterModal(false)}
    ></div>
  );

  const filterModal = (
    <Modal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        renderBackdrop={backdrop}
        className="bg-white p-4 rounded-lg shadow-lg fixed inset-0 mx-auto w-[500px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000]"
    >
        <div>
            <h2 className="bg-black text-white px-2 py-1 mb-2 text-sm font-bold">Filter by event type</h2>
            <div className="grid grid-cols-4 items-center mb-4">
                <label key={'filter-all'} className="flex items-center gap-1">
                        <input
                            type="checkbox"
                            name={'all'}
                            id={'all'}
                            checked={filter.length === 0 || filter.length === filterOptions.length}
                            onChange={(e) => {
                                if (e.target.checked)
                                    setFilter([]);
                            }}
                        ></input>
                        {"show all"}
                    </label>
                {filterOptions.map((v, i) => {
                    return (
                        <label key={i} className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                name={v}
                                id={v}
                                checked={filter.includes(v)}
                                onChange={(e) => {
                                    if (e.target.checked)
                                        setFilter([...filter, v]);
                                    else
                                        setFilter(filter.filter((f) => f !== v));
                                }}
                            ></input>
                            {v}
                        </label>
                    );
                 }
                )}
            </div>
            <button className="" onClick={e => setShowFilterModal(false)}>OK</button>
        </div>
    </Modal>
  );


  const EventDetails = ({dimensions, details}) => {
    return <>
          <div className={`flex flex-col gap-2`}>
              <div className="h-7 px-2 bg-black text-white text-sm font-bold flex items-center">
                  {details?.name ? <span>Event type: {details.name}</span>: <span>no event selected</span>}
                  {/* {dimensions && <span className="ml-auto">{dimensions.width} x {dimensions.height}</span>} */}
              </div>
              <div style={{maxHeight: `${Math.floor(dimensions.height)-30}px`}} className={`overflow-y-scroll overflow-x-hidden w-full`}>
                  <p>{details.description}</p>
              </div>
          </div>
    </>
  }


  const PlayerWrapper = ({dimensions}) => {
    return <>
          <div style={{overflow: "hidden", height: `${dimensions.height}px`}}>
            <Player
                  ref={player}
                  src={url}
                  fluid={true}
                  // playsInline={true}
                >
                  {/* <source src={url} /> */}
                  <CustomControlBar markers={controlbarMarkers} autoHide={false}  />
                  {/* <ControlBar autoHide={false}  /> */}
              </Player>
          </div>
    </>
  }


  return (
    <>
      <div
        id="item-wrapper"
        className="overflow-hidden w-full h-full"
        style={{
          height: windowDimensions.height + "px",
          width: windowDimensions.width + "px",
        }}
      >
        {filterModal}
        <ReflexContainer orientation="vertical">
          <ReflexElement
            propagateDimensions={true}
            propagateDimensionsRate={500}
            flex={0.7}
            className="left-pane max-h-screen"
            style={{ overflow: "hidden" }}
          >
            <ReflexContainer>
              <ReflexElement                
                propagateDimensions={true}
                propagateDimensionsRate={500}
                flex={0.85}
                style={{ overflow: "hidden" }}
              >
                  <Player
                      ref={player}
                      src={url}
                      fluid={true}
                      // playsInline={true}
                    >
                      {/* <source src={url} /> */}
                      <CustomControlBar markers={controlbarMarkers} autoHide={false}  />
                      {/* <ControlBar autoHide={false}  /> */}
                  </Player>
              </ReflexElement>
              <ReflexSplitter
                className="flex items-center"
                style={{ height: "10px" }}
              ></ReflexSplitter>
              <ReflexElement
                propagateDimensions={true}
                propagateDimensionsRate={500}              
              >
                <EventDetails details={selectedEvent} />
              </ReflexElement>
            </ReflexContainer>

          </ReflexElement>

          <ReflexSplitter
            className="flex items-center"
            style={{ width: "10px" }}
          ></ReflexSplitter>

          <ReflexElement className="right-pane" minSize={400}>
            <LogViewer onSelectEvent={(e) => handleSetSelectedEvent(e) } onUpload={(e) => {if (typeof onUpload == "function") onUpload(e) } } onShowFilterModal={() => setShowFilterModal(true)} playerGoTo={PlayerGoTo} autoScroll={logviewerAutoScroll}  currentTime={playerState?.currentTime ?? 0} currentEventIndex={currentEventIndex} traceLogs={normalizedEventsFiltered} className={`py-2`} />
          </ReflexElement>
        </ReflexContainer>
      </div>
    </>
  );
}

EeWrapper.propTypes = {
  events: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        timestamp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        payload: PropTypes.object
      })
  ),
  timeFrame: PropTypes.shape({
    userid: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ts_begin: PropTypes.number,
    ts_end: PropTypes.number
  }),
  url: PropTypes.string
};

export default EeWrapper;
