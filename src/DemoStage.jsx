import colorPalettes from 'nice-color-palettes';
import React from 'react';
import { Motion, spring } from 'react-motion';

import Chart from './Chart.jsx';
import boopUrl from './boop.wav';

const boopSound = new Howl({
    src: [ boopUrl ]
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

class DemoStage extends React.PureComponent {
    constructor() {
        super();

        this.state = {
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
                    margin: '0 auto 60px',
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

            <Chart
                key={this.state.version}
                width={640}
                height={480}
                xLabel={this.state.xLabel}
                yLabel={this.state.yLabel}
                baseColor={this.state.palette[3]}
                secondaryColor={this.state.palette[4]}
                highlightColor={this.state.palette[2]}
                labelColor={this.state.palette[1]}
            />

            <div
                style={{
                    display: 'flex',
                    margin: '40px 0 0',
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
