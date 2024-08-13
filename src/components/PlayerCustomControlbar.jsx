import React from 'react';
import PropTypes from 'prop-types';
import { ControlBar } from 'video-react';
import classNames from 'classnames';

class CustomControlBar extends ControlBar {
    
    constructor(props, context) {
        super(props, context);
    }

    render() {
        const { autoHide, className, disableCompletely } = this.props;
        const children = this.getChildren();
        const progressBarIndex = children.findIndex(c => c.type.displayName === 'ProgressControl');
        let markers = [];

        if (progressBarIndex >= 0) {
            const progressBar = children[progressBarIndex];
            if (this.props.markers) {
                    markers = this.props.markers.map((marker, index) => {
                    const position = (marker.time / this.props.player.duration) * 100;

                    return (
                        <div
                            key={index}
                            style={{ position: 'absolute', left: `${position}%`, width: '1px', height: '4px', backgroundColor: 'white' }}
                        />
                    );
                });
            }

            // children[progressBarIndex] = React.cloneElement(progressBar, { children: markers });
            children[progressBarIndex] = <div key={"progress-bar"} className='flex flex-col video-react-progress-control video-react-control'>
                    <div className='flex w-full flex-1'>
                        {progressBar}
                    </div>
                    <div className='relative -top-2 z-10 w-full'>
                        {markers}
                    </div>
                </div>
        }

        return disableCompletely ? null : (
            <div style={{display: "flex"}}
              className={classNames(
                'video-react-control-bar',
                {
                  'video-react-control-bar-auto-hide': autoHide
                },
                className
              )}
            >
              {children}
            </div>
        );
    }
}

CustomControlBar.propTypes = {
    markers: PropTypes.arrayOf(PropTypes.shape({
        time: PropTypes.number,
    })),
    ...ControlBar.propTypes,
};

export default CustomControlBar;