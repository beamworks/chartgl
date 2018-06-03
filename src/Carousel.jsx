import React from 'react';
import { Motion, spring } from 'react-motion';
import FaAngleLeft from 'react-icons/lib/fa/angle-left';
import FaAngleRight from 'react-icons/lib/fa/angle-right';

class Carousel extends React.PureComponent {
    constructor() {
        super();

        this._itemWidth = 800;
        this._itemSpacing = this._itemWidth + 20;

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
        const nextPosition = this.state.caretPosition + delta;

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
        this.setState({
            positionMin: this.state.caretPosition,
            positionMax: this.state.caretPosition
        });
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
                    marginLeft: `${-(this._itemWidth) / 2}px`,
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '3px'
                }}
            ></div>)}
        </React.Fragment>;
    }

    render() {
        return <div style={{
            display: 'inline-block',
            width: '800px',
            height: '600px',
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
                        defaultStyle={{ caretX: this.state.displayedCaretPosition * this._itemSpacing }}
                        style={{
                            caretX: spring(this.state.displayedCaretPosition * this._itemSpacing, { stiffness: 600, damping: 25 })
                        }}
                        onRest={() => this._settleMotion()}
                    >{({ caretX }) => this._renderItems(caretX)}</Motion>
                </div>
                <div style={{
                    display: 'flex'
                }}>
                    {/* @todo wobble */}
                    <button style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '80px',
                        margin: '0 10px',
                        padding: '15px 0',
                        background: 'rgba(255, 255, 255, 0.3)',
                        border: 0,
                        borderRadius: '3px',
                        outline: 0, // @todo a11y
                        color: '#fff',
                        textShadow: '0 1px 6px rgba(0, 0, 0, 0.2)',
                        fontFamily: 'Michroma, Arial, sans-serif',
                        fontSize: '24px',
                        cursor: 'pointer'
                    }} onClick={() => this._startIntent(-1)}>
                        <FaAngleLeft />
                    </button>
                    <button style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '80px',
                        margin: '0 10px',
                        padding: '15px 0',
                        background: 'rgba(255, 255, 255, 0.3)',
                        border: 0,
                        borderRadius: '3px',
                        outline: 0, // @todo a11y
                        color: '#fff',
                        textShadow: '0 1px 6px rgba(0, 0, 0, 0.2)',
                        fontFamily: 'Michroma, Arial, sans-serif',
                        fontSize: '24px',
                        cursor: 'pointer'
                    }} onClick={() => this._startIntent(1)}>
                        <FaAngleRight />
                    </button>
                </div>
            </div>
        </div>;
    }
}

export default Carousel;
