import React from 'react';
import { Motion, spring } from 'react-motion';
import reglInit from 'regl';
import onecolor from 'onecolor';
import { vec2, vec3 } from 'gl-matrix';

import Chart3DScene from './Chart3DScene.jsx';

function hex2vector(cssHex) {
    const pc = onecolor(cssHex);

    return vec3.fromValues(
        pc.red(),
        pc.green(),
        pc.blue()
    );
}

class PieChart3D extends React.PureComponent {
    constructor({
        values,
        width,
        height,
        palette
    }) {
        super();

        // copy value array and coerce to 0..1
        this._values = [].concat(values).map(
            value => Math.max(0, Math.min(1, value)) || 0
        );

        if (this._values.length < 1) {
            throw new Error('missing values');
        }

        this.state = {
            graphicsInitialized: false
        };

        this._width = width;
        this._height = height;

        this._regl = null; // initialized after first render
    }

    _handleCanvasRef = (canvas) => {
        // when unlinking, help WebGL context get cleaned up
        if (!canvas) {
            this._regl.destroy();
            this._regl = null; // dereference just in case
            return;
        }

        // initialize graphics
        this._regl = reglInit({
            canvas: canvas
        });

        this._regl.clear({
            depth: 1
        });

        this.setState({ graphicsInitialized: true });
    }

    // eslint-disable-next-line max-statements
    render() {
        const baseColor = hex2vector(this.props.baseColor);
        const secondaryColor = hex2vector(this.props.secondaryColor);
        const highlightColor = hex2vector(this.props.highlightColor);

        return <Chart3DScene
            viewportWidth={this._width}
            viewportHeight={this._height}
            distance={600}
            centerX={0}
            centerY={0}
            centerZ={0}
            canvasRef={this._handleCanvasRef}
            content3d={{
            }}
        >{(cameraMat4) => <div style={{
            position: 'absolute',
            top: 0,
            left: 0
        }}>
            <Motion
                defaultStyle={{}}
                style={{}}
            >{motion => {
                if (!this._regl) {
                    return null;
                }

                // no element actually displayed
                return null;
            }}</Motion>
        </div>}</Chart3DScene>;
    }
}

export default PieChart3D;
