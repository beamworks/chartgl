import colorPalettes from 'nice-color-palettes';
import React from 'react';
import ReactDOM from 'react-dom';

import Chart from './Chart.jsx';

document.body.style.background = colorPalettes[1][0];

ReactDOM.render(
    React.createElement(Chart),
    document.getElementById('demo')
);
