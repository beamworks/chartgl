import React from 'react';
import reglInit from 'regl';
import onecolor from 'onecolor';
import { mat4, vec2, vec3 } from 'gl-matrix';

class Chart extends React.PureComponent {
    constructor({
        width,
        height,
        palette
    }) {
        super();

        this.state = {
            series: Array(...new Array(5)).map(() => Math.random()),
            graphicsInitialized: false
        };

        this._width = width;
        this._height = height;

        this._paletteCss = palette;
        this._palette = palette.map(cssHex => {
            const pc = onecolor(cssHex);

            return vec3.fromValues(
                pc.red(),
                pc.green(),
                pc.blue()
            );
        });

        this._regl = null; // initialized after first render

        // reusable computation elements
        this._cameraMat4 = mat4.create();
        this._cameraPositionVec3 = vec3.create();
        this._barBaseVec2 = vec2.create();
    }

    _handleNodeRef = (node) => {
        // ignore node unlinking
        if (!node) {
            return;
        }

        // initialize graphics
        this._regl = reglInit({
            container: node
        });

        this._barCommand = this._regl({
            vert: `
                precision mediump float;

                uniform mat4 camera;
                uniform vec2 base;
                uniform float radius, height;

                attribute vec3 position;
                attribute vec3 normal;

                varying vec3 fragNormal;

                void main() {
                    fragNormal = normal;

                    gl_Position = camera * vec4(
                        base + position.xy * radius,
                        position.z * height,
                        1.0
                    );
                }
            `,

            frag: `
                precision mediump float;

                uniform vec3 baseColor, highlightColor;

                varying vec3 fragNormal;

                void main() {
                    vec3 lightDir = vec3(-0.5, 0.5, 1.0); // non-normalized to ensure top is at 1

                    float light = max(0.0, dot(fragNormal, lightDir));

                    gl_FragColor = vec4(mix(baseColor, highlightColor, light), 1.0);
                }
            `,

            attributes: {
                position: this._regl.buffer([
                    // left face
                    [ -1, 1, 0 ],
                    [ -1, -1, 0 ],
                    [ -1, 1, 1 ],
                    [ -1, -1, 1 ],

                    // degen connector
                    [ -1, -1, 1 ],
                    [ -1, -1, 0 ],

                    // front face
                    [ -1, -1, 0 ],
                    [ 1, -1, 0 ],
                    [ -1, -1, 1 ],
                    [ 1, -1, 1 ],

                    // degen connector
                    [ 1, -1, 1 ],
                    [ -1, -1, 1 ],

                    // top face
                    [ -1, -1, 1 ],
                    [ 1, -1, 1 ],
                    [ -1, 1, 1 ],
                    [ 1, 1, 1 ]
                ]),

                normal: this._regl.buffer([
                    // left face
                    [ -1, 0, 0 ],
                    [ -1, 0, 0 ],
                    [ -1, 0, 0 ],
                    [ -1, 0, 0 ],

                    // degen connector
                    [ -1, 0, 0 ],
                    [ 0, -1, 0 ],

                    // front face
                    [ 0, -1, 0 ],
                    [ 0, -1, 0 ],
                    [ 0, -1, 0 ],
                    [ 0, -1, 0 ],

                    // degen connector
                    [ 0, -1, 0 ],
                    [ 0, 0, 1 ],

                    // top face
                    [ 0, 0, 1 ],
                    [ 0, 0, 1 ],
                    [ 0, 0, 1 ],
                    [ 0, 0, 1 ]
                ])
            },

            uniforms: {
                camera: this._regl.prop('camera'),
                base: this._regl.prop('base'),
                radius: this._regl.prop('radius'),
                height: this._regl.prop('height'),
                baseColor: this._regl.prop('baseColor'),
                highlightColor: this._regl.prop('highlightColor')
            },

            primitive: 'triangle strip',
            count: 4 + 2 + 4 + 2 + 4
        });

        this._regl.clear({
            depth: 1
        });

        this.setState({ graphicsInitialized: true });
    }

    // eslint-disable-next-line max-statements
    render() {
        mat4.perspective(this._cameraMat4, 0.5, this._width / this._height, 1, 5000);

        // camera position
        vec3.set(this._cameraPositionVec3, 0, 0, -1200);
        mat4.translate(this._cameraMat4, this._cameraMat4, this._cameraPositionVec3);

        // camera orbit pitch and yaw
        mat4.rotateX(this._cameraMat4, this._cameraMat4, -0.9);
        mat4.rotateZ(this._cameraMat4, this._cameraMat4, Math.PI / 6);

        // camera offset
        vec3.set(this._cameraPositionVec3, 0, 0, -100);
        mat4.translate(this._cameraMat4, this._cameraMat4, this._cameraPositionVec3);

        // chart 3D layout
        const startX = -100 * (this.state.series.length - 1) / 2;

        if (this._regl) {
            // chart bar display
            this.state.series.forEach((value, index) => {
                vec2.set(this._barBaseVec2, (index * 100) + startX, 0);

                this._barCommand({
                    camera: this._cameraMat4,
                    base: this._barBaseVec2,
                    radius: 40,
                    height: 300 * value,
                    baseColor: this._palette[4],
                    highlightColor: this._palette[3]
                });
            });
        }

        const cameraCssMat = `matrix3d(${this._cameraMat4.join(', ')})`;

        function renderOverlaySpan(modelTransform, style, content) {
            return <span style={{
                position: 'absolute',
                top: 0,
                left: 0,

                // transform in the XY plane, flipping first, and apply camera matrix
                transformStyle: 'preserve-3d',
                transformOrigin: '0 0',
                transform: `${cameraCssMat} ${modelTransform} scale(1, -1)`,

                ...style
            }}>{content}</span>;
        }

        return <div
            ref={this._handleNodeRef}
            style={{
                position: 'relative',
                display: 'inline-block',
                width: this._width + 'px',
                height: this._height + 'px',
                overflow: 'hidden' // clip contents
            }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 0,
                height: 0,
                zIndex: 1, // lift above main chart

                // center transform and emulate WebGL device coord range (-1, 1)
                transformStyle: 'preserve-3d',
                transform: `translate(${this._width / 2}px, ${this._height / 2}px) scale(${this._width / 2}, ${-this._height / 2})`
            }}>
                {renderOverlaySpan(`translate(${startX - 40}px, -60px)`, {
                    width: '400px',
                    height: '80px',

                    fontFamily: 'Arial, sans-serif',
                    fontSize: '40px',
                    color: this._paletteCss[1]
                }, 'Chart X Axis')}

                {renderOverlaySpan(`translate(${startX - 60}px, 200px) rotateZ(-90deg)`, {
                    width: '400px',
                    height: '60px',
                    textAlign: 'center',

                    fontFamily: 'Arial, sans-serif',
                    fontSize: '40px',
                    color: this._paletteCss[1]
                }, 'Chart Y Axis')}
            </div>
        </div>;
    }
}

export default Chart;
