import React from 'react';
import reglInit from 'regl';
import { mat4, vec3 } from 'gl-matrix';

const ASPECT_RATIO = 800 / 600; // @todo change

class Chart extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            graphicsInitialized: false
        }

        this._regl = null; // initialized after first render

        // reusable computation elements
        this._cameraMat4 = mat4.create();
        this._cameraPositionVec3 = vec3.create();
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

        this._testCommand = this._regl({
            vert: `
                precision mediump float;

                uniform mat4 camera;
                attribute vec2 position;

                void main() {
                    gl_Position = camera * vec4(position, 0, 1.0);
                }
            `,

            frag: `
                precision mediump float;

                void main() {
                    gl_FragColor = vec4(0, 0, 0, 1.0);
                }
            `,

            attributes: {
                position: this._regl.buffer([
                    [ -1, -1 ],
                    [ 1, -1 ],
                    [ 1,  1 ],
                    [ -1, 1 ]
                ])
            },

            uniforms: {
                camera: this._regl.prop('camera')
            },

            primitive: 'triangle fan',
            count: 4
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
            vec3.set(this._cameraPositionVec3, 0, 0, -8);
            mat4.translate(this._cameraMat4, this._cameraMat4, this._cameraPositionVec3);

            // camera orbit pitch and yaw
            mat4.rotateX(this._cameraMat4, this._cameraMat4, -Math.PI / 4);
            mat4.rotateZ(this._cameraMat4, this._cameraMat4, Math.PI / 6);

            this._testCommand({
                camera: this._cameraMat4
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
