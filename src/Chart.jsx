import React from 'react';
import reglInit from 'regl';
import onecolor from 'onecolor';
import { mat4, vec2, vec3, vec4 } from 'gl-matrix';

const ASPECT_RATIO = 800 / 600; // @todo change

class Chart extends React.PureComponent {
    constructor({ palette }) {
        super();

        this.state = {
            series: Array.apply(null, new Array(5)).map(() => Math.random()),
            graphicsInitialized: false
        }

        this._palette = palette.map(cssHex => {
            const c = onecolor(cssHex);

            return vec3.fromValues(
                c.red(),
                c.green(),
                c.blue()
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
                    [ 1,  1, 1 ]
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

    render() {
        if (this._regl) {
            mat4.perspective(this._cameraMat4, 0.6, ASPECT_RATIO, 1, 50);

            // camera position
            vec3.set(this._cameraPositionVec3, 0, 0, -12);
            mat4.translate(this._cameraMat4, this._cameraMat4, this._cameraPositionVec3);

            // camera orbit pitch and yaw
            mat4.rotateX(this._cameraMat4, this._cameraMat4, -1.1);
            mat4.rotateZ(this._cameraMat4, this._cameraMat4, Math.PI / 6);

            // camera offset
            vec3.set(this._cameraPositionVec3, 0, 0, -2.5);
            mat4.translate(this._cameraMat4, this._cameraMat4, this._cameraPositionVec3);

            // chart bar display
            const startX = -(this.state.series.length - 1) / 2;
            this.state.series.map((value, index) => {
                vec2.set(this._barBaseVec2, index + startX, 0);

                this._barCommand({
                    camera: this._cameraMat4,
                    base: this._barBaseVec2,
                    radius: 0.4,
                    height: 3 * value,
                    baseColor: this._palette[4],
                    highlightColor: this._palette[3]
                });
            });
        }

        return <div
            ref={this._handleNodeRef}
            style={{
                display: 'inline-block',
                width: '800px',
                height: '600px'
            }}
        />;
    }
}

export default Chart;
