import colorPalettes from 'nice-color-palettes';
import React from 'react';

import Chart from './Chart.jsx';
import boopUrl from './boop.wav';

const palette = colorPalettes[1];

const boopSound = new Howl({
    src: [ boopUrl ]
});

class DemoStage extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            version: 0
        };
    }

    render() {
        document.body.style.background = palette[0];

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
                    fontFamily: 'Michroma, Arial, sans-serif',
                    fontSize: '24px',
                    outline: 'none', // @todo this breaks accessibility
                    cursor: 'pointer'
                }}
                onClick={() => {
                    this.setState({
                        version: this.state.version + 1
                    });

                    boopSound.play();
                }}
            >Reset</button>

            <Chart
                key={this.state.version}
                width={640}
                height={480}
                xLabel={'CHART X-AXIS'}
                yLabel={'Y-AXIS'}
                baseColor={palette[3]}
                secondaryColor={palette[4]}
                highlightColor={palette[2]}
                labelColor={palette[1]}
            />
        </div>;
    }
}

export default DemoStage;
