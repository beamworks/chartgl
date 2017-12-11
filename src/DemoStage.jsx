import colorPalettes from 'nice-color-palettes';
import React from 'react';

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
    'Biotechnology',
    'Business Services',
    'Commercial Banks',
    'Department Stores',
    'Utilities',
    'Electronics',
    'Hotels',
    'Major Banks',
    'Major Chemicals',
    'Major Pharma',
    'Medical',
    'Mining',
    'Office Supplies',
    'Oil & Gas',
    'Consumer Services',
    'Precision Instruments',
    'Real Estate',
    'Restaurants',
    'Semiconductors',
    'Telecommunications',
    'Television',
    'Trucking'
];

class DemoStage extends React.PureComponent {
    constructor() {
        super();

        this.state = {
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
                xLabel: 'PRICE: ' + mockCoinList[Math.floor(Math.random() * mockCoinList.length)],
                yLabel: 'USD 1000'
            });
        } else if (mode < 0.6) {
            this.setState({
                xLabel: 'SALES: ' + mockProductList[Math.floor(Math.random() * mockProductList.length)],
                yLabel: 'UNITS'
            });
        } else {
            this.setState({
                xLabel: 'STOCK: ' + mockIndustryList[Math.floor(Math.random() * mockIndustryList.length)],
                yLabel: 'TRADES'
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
            <button
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
                    outline: 'none', // @todo this breaks accessibility
                    cursor: 'pointer'
                }}
                onClick={() => {
                    this._resetChart();

                    boopSound.play();
                }}
            >Reset</button>

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
        </div>;
    }
}

export default DemoStage;
