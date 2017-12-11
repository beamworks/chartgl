import React from 'react';
import ReactDOM from 'react-dom';
import WebFont from 'webfontloader';

import DemoStage from './DemoStage.jsx';

const rootElement = React.createElement(DemoStage);

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
