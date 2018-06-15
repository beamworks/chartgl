import colorPalettes from 'nice-color-palettes';
import React from 'react';
import { Motion, spring } from 'react-motion';

import Carousel from './Carousel.jsx';
import BarChart3D from './BarChart3D.jsx';
import PieChart3D from './PieChart3D.jsx';
import bumpUrl from './bump.wav';

const bumpSound = new Howl({
    src: [ bumpUrl ],
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

        return <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{
                fontFamily: 'Michroma, Arial, sans-serif',
                fontSize: '24px',
                color: this._palette[1]
            }}>Chart #{this._idNumber}</div>

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
                    <span style={{
                        position: 'absolute',
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: '#444',
                        padding: '0px 10px 3px', // vertical alignment nudge
                        borderRadius: '5px',
                        fontFamily: 'Michroma, Arial, sans-serif',
                        fontSize: '20px',
                        transform: 'translate(-50%, -100%) translate(0, -8px)'
                    }}>
                        <span style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            marginLeft: '-8px',
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: '8px solid rgba(255, 255, 255, 0.9)'
                        }} />
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

        this.state = {
            isReady: process.env.NODE_ENV === 'development' // require a click to be able to play sound on hover in Chrome
        };
    }

    render() {
        if (!this.state.isReady) {
            return <div style={{
                display: 'inline-block',
                padding: '40px', // generous padding to help taps/clicks
                fontFamily: 'Michroma, Arial, sans-serif',
                fontSize: '24px',
                cursor: 'pointer'
            }} onClick={() => this.setState({ isReady: true })}>
                Click / Tap
            </div>
        }

        return <div style={{
            display: 'inline-block'
        }}>
            <Carousel
                renderItem={(position, isActive, isInView) => <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                }}>
                    <RandomChart position={position} active={isActive} inView={isInView} />
                </div>}
            />

            <div
                style={{
                    display: 'flex',
                    margin: '60px 0 0',
                    justifyContent: 'space-between',
                    fontFamily: 'Courier New, mono',
                    fontSize: '16px',
                    letterSpacing: '-2px'
                }}
            >
                <a
                    href="https://github.com/beamworks/chartgl"
                    style={{
                        padding: '0 5px',
                        color: '#fff',
                        background: 'rgba(0, 0, 0, 0.5)',
                        opacity: 0.3,
                        outline: 'none', // @todo this breaks accessibility
                        textDecoration: 'none'
                    }}
                >ChartGL: an experiment in React + WebGL + CSS3D</a>
                <a
                    href="https://twitter.com/unframework"
                    style={{
                        padding: '0 5px',
                        color: '#fff',
                        background: 'rgba(0, 0, 0, 0.5)',
                        opacity: 0.3,
                        outline: 'none', // @todo this breaks accessibility
                        textDecoration: 'none'
                    }}
                >(by Nick Matantsev)</a>
            </div>
        </div>;
    }
}

export default DemoStage;
