import React from 'react';
import { Timeout } from 'react-dynamics';
import { Motion, spring } from 'react-motion';
import FaAngleLeft from 'react-icons/lib/fa/angle-left';
import FaAngleRight from 'react-icons/lib/fa/angle-right';

import Wobbler from './Wobbler.jsx';

import boopUrl from './boop.wav';
import chirpUrl from './chirp.wav';

const boopSound = new Howl({
    src: [ boopUrl ]
});

const chirpSound = new Howl({
    src: [ chirpUrl ],
    volume: 0.5
});

class Carousel extends React.PureComponent {
    constructor() {
        super();

        this._itemWidth = 800 - 20;
        this._itemSpacing = this._itemWidth + 40;
        this._minBound = 0;

        this._renderedPositionMin = 0;
        this._renderedPositionMax = 0;

        this.state = {
            displayedCaretPosition: 0,
            caretPosition: 0,
            positionMin: 0,
            positionMax: 0
        };
    }

    _startIntent(delta) {
        // first pre-render the item(s) needed for transition
        // (allowing caret position to temporarily be out of bounds)
        const nextPosition = Math.max(this._minBound - 1, this.state.caretPosition + delta);

        this.setState({
            caretPosition: nextPosition,
            positionMin: Math.min(nextPosition, this.state.positionMin),
            positionMax: Math.max(nextPosition, this.state.positionMax)
        });

        // try and advance caret in a separate tick, once target item is rendered
        requestAnimationFrame(() => {
            this.setState(state => {
                return {
                    displayedCaretPosition: state.caretPosition
                };
            });
        });
    }

    _settleMotion() {
        // clobber all non-displayed items once animation is done
        // (if animation rests out of bounds, keep showing the first valid slot)
        this.setState({
            positionMin: this.state.caretPosition,
            positionMax: Math.max(this._minBound, this.state.caretPosition)
        });
    }

    _renderPushBack(isActive) {
        // after short delay, nudge back to minimum bound
        return <Timeout on={isActive} delayMs={100} then={() => {
            if (this.state.caretPosition < this._minBound) {
                this._startIntent(1);
            }
        }}>{() => null}</Timeout>;
    }

    _renderItems(caretX) {
        const positionMin = this.state.positionMin;
        const positionMax = this.state.positionMax;
        const positions = Array(... new Array(positionMax - positionMin + 1)).map((_, index) => positionMin + index);

        return <React.Fragment>
            {positions.map(position => <div
                key={position}
                data-position={position}
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${position * this._itemSpacing - caretX}px`,
                    width: `${this._itemWidth}px`,
                    marginLeft: `${-(this._itemWidth) / 2}px`
                }}
            >
                {position < this._minBound
                    ? this._renderPushBack(position === this.state.caretPosition)
                    : this.props.renderItem(
                        position,
                        position === this.state.caretPosition,
                        Math.abs(position - caretX / this._itemSpacing) < 0.2
                    )
                }
            </div>)}
        </React.Fragment>;
    }

    _renderNavButton(delta, icon) {
        const isBoundedAction = this.state.caretPosition + delta < this._minBound;

        return <Wobbler
            size={100}
            activeSize={120}
            stiffness={800}
            damping={15}
        >{(size, triggerWobble) => <button style={{
            display: 'flex',
            justifyContent: 'center',
            width: '80px',
            margin: '10px 10px', // extra vertical space for wobble to not get cut off
            padding: '15px 0',
            background: 'rgba(0, 0, 0, 0.2)',
            transform: `scale(${(100 + 0.5 * (size - 100)) / 100}, ${100 / size})`,
            transformOrigin: delta < 0 ? '120% 50%' : '-20% 50%',
            border: 0,
            borderRadius: '3px',
            outline: 0, // @todo a11y
            opacity: isBoundedAction ? 0.3 : 1,
            color: '#fff',
            fontFamily: 'Michroma, Arial, sans-serif',
            fontSize: '24px',
            cursor: 'pointer'
        }} onClick={() => {
            this._startIntent(delta);

            triggerWobble();

            // audio response
            if (isBoundedAction) {
                chirpSound.play();
            } else {
                boopSound.play();
            }
        }}>
            {icon}
        </button>}</Wobbler>;
    }

    render() {
        const isWithinBounds = this.state.displayedCaretPosition >= this._minBound;
        const caretTargetX = isWithinBounds
            ? this.state.displayedCaretPosition * this._itemSpacing
            : this._minBound * this._itemSpacing - 20;

        return <div style={{
            display: 'inline-block',
            width: '700px',
            height: '620px',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                alignItems: 'center'
            }}>
                <div style={{
                    position: 'relative',
                    flex: 1,
                    marginBottom: '10px'
                }}>
                    <Motion
                        defaultStyle={{ caretX: caretTargetX }}
                        style={{
                            caretX: spring(caretTargetX, { stiffness: isWithinBounds ? 200 : 2000, damping: 20, precision: isWithinBounds ? 5 : 1 })
                        }}
                        onRest={() => this._settleMotion()}
                    >{({ caretX }) => this._renderItems(caretX)}</Motion>
                </div>
                <div style={{
                    display: 'flex'
                }}>
                    {this._renderNavButton(-1, <FaAngleLeft />)}
                    {this._renderNavButton(1, <FaAngleRight />)}
                </div>
            </div>
        </div>;
    }
}

export default Carousel;
