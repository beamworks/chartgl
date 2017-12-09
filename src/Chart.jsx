import React from 'react';
import reglInit from 'regl';

class Chart extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            graphicsInitialized: false
        }

        this._regl = null; // initialized after first render
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

                attribute vec2 position;

                void main() {
                    gl_Position = vec4(position * 0.5, 0, 1.0);
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
            this._testCommand();
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
