import colorPalettes from 'nice-color-palettes';
import React from 'react';
import ReactDOM from 'react-dom';

import Chart from './Chart.jsx';

const palette = colorPalettes[1];
document.body.style.background = palette[0];

ReactDOM.render(
    React.createElement(Chart, {
        palette: palette
    }),
    document.getElementById('demo')
);
