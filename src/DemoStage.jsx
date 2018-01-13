import colorPalettes from 'nice-color-palettes';
import React from 'react';
import { Motion, spring } from 'react-motion';

import BarChart3D from './BarChart3D.jsx';
import PieChart3D from './PieChart3D.jsx';
import boopUrl from './boop.wav';
import bumpUrl from './bump.wav';
import chirpUrl from './chirp.wav';

const boopSound = new Howl({
    src: [ boopUrl ]
});

const bumpSound = new Howl({
    src: [ bumpUrl ],
    volume: 0.5
});

const chirpSound = new Howl({
    src: [ chirpUrl ],
    volume: 0.5
});

const mockCoinList = [
    'BITCOIN',
    'ETHEREUM',
    'DOGECOIN'
];

const mockProductList = [
    'Burritos',
    'Flat Bread',
    'Mushrooms',
    'Canelloni',
    'Spring Water',
    'Evaporated Milk',
    'Pears',
    'Pork',
    'Passion Fruit',
    'Iced Tea',
    'Blueberry',
    'Spinach',
    'Tomato',
    'Fuji Apples',
    'Cream Soda',
    'Pepper Squash',
    'Mozzarella',
    'Artichoke Hearts',
    'Smoked Paprika',
    'Muffin Mix',
    'Arctic Char',
    'Bagels',
    'Enoki Mushroom',
    'Ground Ginger',
    'Caesar Salad',
    'Spaghetti',
    'Venison',
    'Beets',
    'Crab Meat',
    'Tomato Paste',
    'Pastry Flour',
    'Chilli Paste'
];

const mockIndustryList = [
    'Auto Parts',
    'Banks',
    'Biotechnology',
    'Retail',
    'Utilities',
    'Electronics',
    'Hotels',
    'Chemicals',
    'Pharma',
    'Manufacturing',
    'Medical',
    'Mining',
    'Office Supplies',
    'Oil & Gas',
    'Real Estate',
    'Restaurants',
    'Retail',
    'Semiconductors',
    'Telecom',
    'Television',
    'Trucking'
];

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

class DemoStage extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            series: [],
            resetButtonZoom: 100,
            version: 0
        };
    }

    componentWillMount() {
        this._resetChart();
    }

    _resetChart() {
        const mode = Math.random();

        if (mode < 0.2) {
            this.setState({
                xLabel: 'CRYPTO: ' + mockCoinList[Math.floor(Math.random() * mockCoinList.length)],
                yLabel: 'PRICE'
            });
        } else if (mode < 0.6) {
            this.setState({
                xLabel: 'SALES: ' + mockProductList[Math.floor(Math.random() * mockProductList.length)],
                yLabel: 'VOLUME'
            });
        } else {
            this.setState({
                xLabel: 'STOCK: ' + mockIndustryList[Math.floor(Math.random() * mockIndustryList.length)],
                yLabel: 'TRADE'
            });
        }

        // start with default palette at first, then randomize
        const paletteIndex = this.state.version > 2
            ? Math.floor(Math.random() * colorPalettes.length)
            : 1;

        this.setState({
            series: Array(...new Array(3 + Math.floor(Math.random() * 10))).map(() => Math.random()),
            pieSeries: Array(...new Array(3 + Math.floor(Math.random() * 10))).map(() => Math.random()),
            palette: colorPalettes[paletteIndex],
            version: this.state.version + 1
        });
    }

    render() {
        document.body.style.background = this.state.palette[0];

        return <div style={{
            display: 'inline-block'
        }}>
            <Motion
                defaultStyle={{ zoom: 100 }}
                style={{
                    zoom: spring(this.state.resetButtonZoom, { stiffness: 800, damping: 15 })
                }}
            >{({ zoom }) => <button
                type="button"
                style={{
                    display: 'block',
                    margin: '0 auto 30px',
                    width: '200px',
                    height: '60px',
                    border: '0',
                    padding: '0 0 5px',
                    borderRadius: '3px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    textShadow: '0 1px 6px rgba(0, 0, 0, 0.2)',
                    fontFamily: 'Michroma, Arial, sans-serif',
                    fontSize: '24px',
                    transform: `scale(${(100 - 0.5 * (zoom - 100)) / 100}, ${zoom / 100})`,
                    outline: 'none', // @todo this breaks accessibility
                    cursor: 'pointer'
                }}
                onClick={() => {
                    this._resetChart();

                    // enlarge and then reset back to normal
                    this.setState({ resetButtonZoom: 120 });

                    setTimeout(() => {
                        this.setState({ resetButtonZoom: 100 });
                    }, 100);

                    boopSound.play();
                }}
            >Generate</button>}</Motion>

            <BarChart3D
                key={this.state.version}
                values={this.state.series}
                width={640}
                height={480}
                xLabel={this.state.xLabel}
                yLabel={this.state.yLabel}
                baseColor={this.state.palette[3]}
                secondaryColor={this.state.palette[4]}
                highlightColor={this.state.palette[2]}
                labelColor={this.state.palette[1]}
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
                        {'0.' + Math.floor(100 + this.state.series[index] * 100).toString().slice(-2)}
                    </span>
                </BumpSound> : null}
                onBarClick={() => {
                    chirpSound.play();
                }}
            />

            <div
                style={{
                    display: 'block'
                }}
            />

            <PieChart3D
                key={this.state.version + 1}
                values={this.state.pieSeries}
                width={640}
                height={480}
                baseColor={this.state.palette[3]}
                secondaryColor={this.state.palette[4]}
                highlightColor={this.state.palette[2]}
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
