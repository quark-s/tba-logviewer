import { PureComponent, useEffect, useState, createRef } from "react";
import PropTypes from "prop-types";
import urlPropType from "url-prop-type";
import { render } from "react-dom";



class VideoWrapper extends PureComponent {

  constructor(props) {
    super(props);

    this.iframeRef = createRef();
    this.sendGetState = this.sendGetState.bind(this);
    this.sendPreloadState = this.sendPreloadState.bind(this);

    this.state = {
      wrapperScaling: 1,
    };
    // this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.setState(VideoWrapper.refreshScalingFactor(this.props));
  }

  sendGetState(){
    if(this.iframeRef.current)
      this.iframeRef.current.contentWindow.postMessage(JSON.stringify({eventType: 'getTasksState'}), "*");
  }

  sendPreloadState(state){
    console.log(state);
    if(this.iframeRef.current && !!state && Object.keys(state).length > 0)
      this.iframeRef.current.contentWindow.postMessage(JSON.stringify({eventType: 'preloadTasksState', state}), "*");
  }

  static getDerivedStateFromProps(props, state) {
    // console.log(1);
    return VideoWrapper.refreshScalingFactor(props);
  }  

  static refreshScalingFactor = (props) => {

    const { width: availWidth, height: availHeight } = props.dimensions;
    const { width: itemWidth, height: itemHeight } = props.itemDimensions;
    const defaultState = { wrapperScaling: 1 }

    if (isNaN(availWidth) || isNaN(availHeight)) return defaultState;

    // console.log(itemWidth, itemHeight);

    let sfh = 1;
    let sfw = 1;
    let scalingFactor = 1;

    // if (availHeight < itemHeight)
    sfh = Math.ceil((availHeight * 1000) / itemHeight) / 1000;
    // if (availWidth < itemWidth)
    sfw = Math.ceil((availWidth * 1000) / itemWidth) / 1000;
    scalingFactor = sfw;
    // if (sfh < 1 || sfw < 1) 
      scalingFactor = Math.min(sfh, sfw);

    console.log(availWidth, availHeight,sfw, sfh);

    return { wrapperScaling: scalingFactor };
  };


  render() {

    const { width: itemWidth, height: itemHeight } = this.props.itemDimensions;
    
     return (
      <>
        <div
          id="iframe-wrapper"
          className={`h-full w-full ${this.props.className}`}
          style={{
            transform: `scale(${this.state.wrapperScaling})`,
            transformOrigin: "top left",
          }}
        >
          <iframe
            id="cbaframe"
            src={this.props.url}
            className="border-0 m-0 p-0 overflow-hidden cbaframe w-full"
            ref={this.iframeRef}
            style={{
              // height: "100vh",
              width: itemWidth + "px",
              height: itemHeight + "px"
              //   width: 100*(1 / wrapperScaling)+"%"
              // width: 100*(Math.ceil(1000 / wrapperScaling) / 1000)+"%"
            }}
          ></iframe>
        </div>
      </>
    );
  }
}

VideoWrapper.propTypes = {
  url: urlPropType.isRequired,
  // dimensions: PropTypes.shape({
  //   height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  //   width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  // }),
  // itemDimensions: PropTypes.shape({
  //   height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  //   width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  // }),
};

export default VideoWrapper;
