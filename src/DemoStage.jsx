import colorPalettes from 'nice-color-palettes';
import React from 'react';

import Chart from './Chart.jsx';

const palette = colorPalettes[1];

class DemoStage extends React.PureComponent {
    constructor() {
        super();

    }

    render() {
        document.body.style.background = palette[0];

        return <Chart
            width={640}
            height={480}
            baseColor={palette[3]}
            secondaryColor={palette[4]}
            highlightColor={palette[2]}
            labelColor={palette[1]}
        />;
    }
}

export default DemoStage;
