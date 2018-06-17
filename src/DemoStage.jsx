import colorPalettes from 'nice-color-palettes';
import React from 'react';
import { Motion, spring } from 'react-motion';
import FaAngleLeft from 'react-icons/lib/fa/angle-left';
import FaAngleRight from 'react-icons/lib/fa/angle-right';

import Carousel from './Carousel.jsx';
import BarChart3D from './BarChart3D.jsx';
import PieChart3D from './PieChart3D.jsx';
import bumpUrl from './bump.wav';
import boopUrl from './boop.wav';
import chirpUrl from './chirp.wav';

import './DemoStage.scss';

import Wobbler from './Wobbler.jsx';

const bumpSound = new Howl({
    src: [ bumpUrl ],
    volume: 0.5
});

const boopSound = new Howl({
    src: [ boopUrl ]
});

const chirpSound = new Howl({
    src: [ chirpUrl ],
    volume: 0.5
});

const mockStockList = [
    'Trading YTD',
    'Last Session',
    'After Hours'
];

const mockSalesList = [
    'Q1 Prev Year',
    'Q3 This Year',
    'YoY Change',
    'Historical'
];

const mockRequestMetricList = [
    'Response',
    'IO Wait',
    'Peak Lag'
];

// credit: https://gist.github.com/blixt/f17b47c62508be59987b
const SEED_OFFSET = new Date().getTime();

function randomize(seed) {
    const intSeed = seed % 2147483647;
    const safeSeed = intSeed > 0 ? intSeed : intSeed + 2147483646;
    return safeSeed * 16807 % 2147483647;
}

function getRandomizedFraction(seed) {
    return (seed - 1) / 2147483646;
}

class BumpSound extends React.PureComponent {
    componentWillMount() {
        bumpSound.play();
    }

    render() {
        // pass through a single DOM element
        return this.props.children
            ? React.Children.only(this.props.children)
            : null;
    }
}

class RandomChart extends React.PureComponent {
    constructor(props) {
        super();

        // seeded random generation for predictable results
        // @todo use pie chart, too
        const startSeed = randomize(props.position * 150000 + SEED_OFFSET);
        const random1 = randomize(startSeed);
        const random2 = randomize(random1);
        const random3 = randomize(random2);
        const random4 = randomize(random3);

        const mode = getRandomizedFraction(random1);
        const textSelector = getRandomizedFraction(random2);
        const paletteSelector = getRandomizedFraction(random3);
        const seriesLengthSelector = getRandomizedFraction(random4);

        this._textInfo = null;

        this._idNumber = random2 % 100000;

        if (mode < 0.2) {
            this._textInfo = {
                xLabel: 'STOCK: ' + mockStockList[Math.floor(textSelector * mockStockList.length)],
                yLabel: 'PRICE'
            };
        } else if (mode < 0.6) {
            this._textInfo = {
                xLabel: 'SALES: ' + mockSalesList[Math.floor(textSelector * mockSalesList.length)],
                yLabel: 'VOLUME'
            };
        } else {
            this._textInfo = {
                xLabel: 'REQUEST: ' + mockRequestMetricList[Math.floor(textSelector * mockRequestMetricList.length)],
                yLabel: 'TIME (ms)'
            };
        }

        // start with default palette at first, then randomize
        const paletteIndex = Math.abs(props.position) > 1
            ? Math.floor(paletteSelector * colorPalettes.length)
            : 1;
        this._palette = colorPalettes[paletteIndex];

        this._series = Array(...new Array(3 + Math.floor(seriesLengthSelector * 10))).reduce(
            (itemSeedList) => {
                const prevSeed = itemSeedList.length > 0 ? itemSeedList[itemSeedList.length - 1] : random4;
                return itemSeedList.concat([ randomize(prevSeed) ]);
            },
            []
        ).map(itemSeed => getRandomizedFraction(itemSeed));

        this.state = {
            isAnimating: !!props.inView
        };
    }

    componentWillReceiveProps(nextProps) {
        // one-time trigger for animation state once in center view
        if (nextProps.inView) {
            this.setState({
                isAnimating: true
            });
        }
    }

    render() {
        // update body background
        if (this.props.active) {
            document.body.style.background = this._palette[0];
        }

        return <div className="random-chart">
            <div className="_title" style={{ color: this._palette[1] }}>
                Chart #{this._idNumber}
            </div>

            {<BarChart3D
                blank={!this.state.isAnimating}
                values={this._series}
                width={640}
                height={480}
                xLabel={this._textInfo.xLabel}
                yLabel={this._textInfo.yLabel}
                baseColor={this._palette[3]}
                secondaryColor={this._palette[4]}
                highlightColor={this._palette[2]}
                labelColor={this._palette[1]}
                renderBar={(index, isActive) => isActive ? <BumpSound>
                    <span className="random-chart__hover-label">
                        <span className="_arrow" />

                        {'0.' + Math.floor(100 + this._series[index] * 100).toString().slice(-2)}
                    </span>
                </BumpSound> : null}
                onBarClick={() => {
                    bumpSound.play();
                }}
            />}
        </div>;
    }
}

class DemoStage extends React.PureComponent {
    constructor() {
        super();

        this._carousel = null; // carousel control node

        this.state = {
            carouselIsAtLowerBound: true,
            isReady: process.env.NODE_ENV === 'development' // require a click to be able to play sound on hover in Chrome
        };
    }

    _renderNavButton(delta, icon) {
        const isBoundedAction = delta < 0 && this.state.carouselIsAtLowerBound;

        return <Wobbler
            size={100}
            activeSize={120}
            stiffness={800}
            damping={15}
        >{(size, triggerWobble) => <button
            data-bounded={isBoundedAction}
            data-forward={delta > 0}
            style={{
                transform: `scale(${(100 + 0.5 * (size - 100)) / 100}, ${100 / size})`
            }}
            onClick={() => {
                this._carousel.changeCaretPosition(delta);

                triggerWobble();

                // audio response
                if (isBoundedAction) {
                    chirpSound.play();
                } else {
                    boopSound.play();
                }
            }}
        >
            {icon}
        </button>}</Wobbler>;
    }

    render() {
        if (!this.state.isReady) {
            return <div className="demo-stage-prelude" onClick={() => this.setState({ isReady: true })}>
                Click / Tap
            </div>
        }

        return <div className="demo-stage">
            <div className="_carousel">
                <Carousel
                    ref={node => this._carousel = node}
                    onCaretChange={(caret, isAtLowerBound) => this.setState({ carouselIsAtLowerBound: isAtLowerBound })}
                    renderItem={(position, isActive, isInView) => <div className="demo-stage__carousel-item">
                        <RandomChart position={position} active={isActive} inView={isInView} />
                    </div>}
                />
            </div>

            <div className="_nav">
                {this._renderNavButton(-1, <FaAngleLeft />)}
                {this._renderNavButton(1, <FaAngleRight />)}
            </div>

            <div className="_footer">
                <a href="https://github.com/beamworks/chartgl">
                    React + WebGL + CSS3D + Motion
                </a>
                <a href="https://beamworks.io">
                    beamworks.io
                </a>
            </div>
        </div>;
    }
}

export default DemoStage;
