import colorPalettes from 'nice-color-palettes';
import React from 'react';
import ReactDOM from 'react-dom';
import WebFont from 'webfontloader';

import Chart from './Chart.jsx';

const palette = colorPalettes[1];
document.body.style.background = palette[0];

const rootElement = React.createElement(Chart, {
    width: 640,
    height: 480,
    baseColor: palette[3],
    secondaryColor: palette[4],
    highlightColor: palette[2],
    labelColor: palette[1]
});

// render after resources are ready
WebFont.load({
    google: {
        families: [ 'Michroma' ]
    },

    active: function () {
        ReactDOM.render(
            rootElement,
            document.getElementById('demo')
        );
    }
});
