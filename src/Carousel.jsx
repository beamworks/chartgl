import React from 'react';
import { Timeout } from 'react-dynamics';
import { Motion, spring } from 'react-motion';

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

    changeCaretPosition(delta) {
        // allow caret position to temporarily be out of bounds
        this._setPosition(Math.max(
            this._minBound - 1,
            this.state.caretPosition + delta
        ));
    }

    _setPosition(nextPosition) {
        // first pre-render the item(s) needed for transition
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
                this._setPosition(this._minBound);
            }
        }}>{() => null}</Timeout>;
    }

    _renderItems(caretX) {
        const positionMin = this.state.positionMin;
        const positionMax = this.state.positionMax;
        const positions = Array(... new Array(positionMax - positionMin + 1)).map((_, index) => positionMin + index);

        return <div style={{
            position: 'relative',
            flex: 1
        }}>
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
        </div>;
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
                <Motion
                    defaultStyle={{
                        caretX: caretTargetX
                    }}
                    style={{
                        caretX: spring(caretTargetX, {
                            stiffness: isWithinBounds ? 200 : 2000,
                            damping: 20,
                            precision: isWithinBounds ? 5 : 1
                        })
                    }}
                    onRest={() => this._settleMotion()}
                >{({ caretX }) =>
                    this._renderItems(caretX)
                }</Motion>
            </div>
        </div>;
    }
}

export default Carousel;
