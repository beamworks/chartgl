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

        this._sliceCommandList = this._values.map(value => {
            // 64 segments for entire circle
            const segmentCount = Math.ceil(value * 64);
            const segmentList = Array(...new Array(segmentCount));

            return this._regl({
                vert: `
                    precision mediump float;

                    #define M_PI 3.1415926535897932384626433832795

                    uniform mat4 camera;
                    uniform float radius, width, height;
                    uniform float start, end;

                    attribute vec3 position;
                    attribute vec3 normal;

                    varying vec3 fragPosition;
                    varying vec3 fragNormal;

                    void main() {
                        float azimuth = 2.0 * M_PI * (start + (end - start) * position.y);
                        float sinA = sin(azimuth);
                        float cosA = cos(azimuth);

                        float dist = radius + position.x * width;
                        float z = position.z * height;

                        fragPosition = vec3(
                            dist * cosA,
                            dist * sinA,
                            z
                        );

                        // rotate normal
                        fragNormal = vec3(
                            normal.x * cosA - normal.y * sinA,
                            normal.y * cosA + normal.x * sinA,
                            normal.z
                        );

                        gl_Position = camera * vec4(
                            fragPosition,
                            1.0
                        );
                    }
                `,

                frag: `
                    precision mediump float;

                    uniform vec3 baseColor, secondaryColor, highlightColor;
                    uniform float height;
                    uniform float highlight;

                    varying vec3 fragPosition;
                    varying vec3 fragNormal;

                    void main() {
                        vec3 pigmentColor = baseColor;

                        vec3 lightDir = vec3(-0.5, 0.5, 1.0); // non-normalized to ensure top is at 1
                        float light = max(0.0, dot(fragNormal, lightDir));

                        float highlightMix = 1.75 * max(0.0, min(0.5, highlight - 0.25)); // clip off bouncy edges of value range

                        gl_FragColor = vec4(mix(pigmentColor, highlightColor, highlightMix + (1.0 - highlightMix) * light), 1.0);
                    }
                `,

                // define data in two-vertex batches (ReGL flattens sub-arrays, but needs them to be consistent size)
                attributes: {
                    position: this._regl.buffer([
                        ...segmentList.map((v, index) => [ 0, 1 - (index / segmentCount), 1, 0, 1 - (index / segmentCount), 0 ]), [ 0, 0, 1, 0, 0, 0 ], // inner face
                        [ 0, 0, 1, 0, 0, 0 ], [ 1, 0, 1, 1, 0, 0 ], // start face
                        ...segmentList.map((v, index) => [ 1, (index / segmentCount), 1, 1, (index / segmentCount), 0 ]), [ 1, 1, 1, 1, 1, 0 ], // outer face
                        [ 1, 1, 1, 1, 1, 0 ], [ 0, 1, 1, 0, 1, 0 ], // end face
                        [ 0, 1, 0, 0, 0, 1 ], // degen connector
                        ...segmentList.map((v, index) => [ 0, (index / segmentCount), 1, 1, (index / segmentCount), 1 ]), [ 0, 1, 1, 1, 1, 1 ] // top face
                    ]),

                    normal: this._regl.buffer([
                        ...segmentList.map(() => [ -1, 0, 0, -1, 0, 0 ]), [ -1, 0, 0, -1, 0, 0 ], // inner face
                        [ 0, -1, 0, 0, -1, 0 ], [ 0, -1, 0, 0, -1, 0 ], // start face
                        ...segmentList.map(() => [ 1, 0, 0, 1, 0, 0 ]), [ 1, 0, 0, 1, 0, 0 ], // outer face
                        [ 0, 1, 0, 0, 1, 0 ], [ 0, 1, 0, 0, 1, 0 ], // end face
                        [ 0, 1, 0, 0, 0, 1 ], // degen connector
                        ...segmentList.map(() => [ 0, 0, 1, 0, 0, 1 ]), [ 0, 0, 1, 0, 0, 1 ] // top face
                    ])
                },

                uniforms: {
                    camera: this._regl.prop('camera'),
                    radius: this._regl.prop('radius'),
                    width: this._regl.prop('width'),
                    height: this._regl.prop('height'),
                    start: this._regl.prop('start'),
                    end: this._regl.prop('end'),
                    highlight: this._regl.prop('highlight'),
                    baseColor: this._regl.prop('baseColor'),
                    secondaryColor: this._regl.prop('secondaryColor'),
                    highlightColor: this._regl.prop('highlightColor')
                },

                primitive: 'triangle strip',
                count: (2 * segmentCount + 2) + 4 + (2 * segmentCount + 2) + 4 + 2 + (2 * segmentCount + 2)
            });
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

        const content3d = {};

        let sliceStartAccumulator = -0.2;
        this._values.forEach((value, index) => {
            const start = sliceStartAccumulator * 2 * Math.PI;
            sliceStartAccumulator += value;

            const height = 10 + index * 8;

            const quadCount = Math.ceil(value * 12);
            const quadList = Array(...new Array(quadCount));
            const quadAngle = value * 2 * Math.PI / quadCount;

            const quadNodeList = quadList.map((v, quadIndex) => <div key={index + 'q' + quadIndex} style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '250px',
                height: '250px',
                overflow: 'hidden',

                // rotate to quad angle and shear to have the needed corner angle
                transformOrigin: '0 0',
                transform: `
                    translate(250px, 250px)
                    rotate(${quadIndex * quadAngle}rad)
                    matrix(1, 0, ${Math.cos(quadAngle)}, ${Math.sin(quadAngle)}, 0, 0)
                `
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `rgba(0, 0, 0, ${0.1 + index * 0.1})`,

                    // shear to be clipped into a triangle
                    transformOrigin: '0 0',
                    transform: `
                        matrix(1, 0, -1, 1, 0, 0)
                    `
                }} />
            </div>);

            content3d[`
                translate3d(0, 0, ${height}px)
                rotate(${start}rad)
                scale(1, -1)
            `] = <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '500px',
                height: '500px',

                transformOrigin: '0 0',
                transform: `translate(-250px, -250px)`
            }}>{quadNodeList}</div>
        });

        return <Chart3DScene
            viewportWidth={this._width}
            viewportHeight={this._height}
            distance={1200}
            centerX={0}
            centerY={0}
            centerZ={80}
            canvasRef={this._handleCanvasRef}
            content3d={content3d}
        >{(cameraMat4) => <div style={{
            position: 'absolute',
            top: 0,
            left: 0
        }}>
            <Motion
                defaultStyle={{ start: 0 }}
                style={{ start: spring(1, { stiffness: 320, damping: 15 }) }}
            >{motion => {
                if (!this._regl) {
                    return null;
                }

                // sample slice
                this._values.reduce((start, value, index) => {
                    const end = start + value;

                    this._sliceCommandList[index]({
                        camera: cameraMat4,
                        radius: 100,
                        width: 150,
                        height: 10 + motion.start * index * 8,
                        start: start,
                        end: end,
                        highlight: 0,
                        baseColor: baseColor,
                        secondaryColor: secondaryColor,
                        highlightColor: highlightColor
                    });

                    // set up next start
                    return end;
                }, -0.2);

                // no element actually displayed
                return null;
            }}</Motion>
        </div>}</Chart3DScene>;
    }
}

export default PieChart3D;
