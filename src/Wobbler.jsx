import React from 'react';
import { Timeout } from 'react-dynamics';
import { Motion, spring } from 'react-motion';

class Wobbler extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            clickCount: 0
        };
    }

    _triggerHandler = () => {
        // update count to trigger new timeout
        this.setState(state => ({ clickCount: state.clickCount + 1 }));
    }

    render() {
        return <Timeout
            on={this.state.clickCount}
            delayMs={this.props.delayMs || 100}
        >{(timeoutState) => <Motion
            defaultStyle={{ animatedSize: this.props.size }}
            style={{
                animatedSize: spring(timeoutState ? this.props.activeSize : this.props.size, {
                    stiffness: this.props.stiffness,
                    damping: this.props.damping
                })
            }}
        >{({ animatedSize }) =>
            this.props.children(animatedSize, this._triggerHandler)
        }</Motion>}</Timeout>;
    }
}

export default Wobbler;
