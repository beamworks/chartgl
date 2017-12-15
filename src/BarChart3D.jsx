import React from 'react';
import { Motion, spring } from 'react-motion';
import reglInit from 'regl';
import onecolor from 'onecolor';
import { mat4, vec2, vec3 } from 'gl-matrix';

import bumpUrl from './bump.wav';

const bumpSound = new Howl({
    src: [ bumpUrl ],
    volume: 0.5
});

function hex2vector(cssHex) {
    const pc = onecolor(cssHex);

    return vec3.fromValues(
        pc.red(),
        pc.green(),
        pc.blue()
    );
}

class BarChart3D extends React.PureComponent {
    constructor({
        width,
        height,
        palette
    }) {
        super();

        const mockData = Array(...new Array(3 + Math.floor(Math.random() * 10))).map(() => Math.random());

        this.state = {
            series: mockData,
            barStatus: mockData.map(() => false),
            graphicsInitialized: false
        };

        this._width = width;
        this._height = height;

        this._chartAreaW = 500;
        this._chartAreaH = 300;
        this._barSpacing = 10;
        this._barExtraRadius = this._barSpacing * 0.3;
        this._patternSize = 50;

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

                varying vec3 fragPosition;
                varying vec3 fragNormal;

                void main() {
                    float z = position.z * height;

                    fragPosition = vec3(
                        (position.xy + vec2(1.0, 1.0)) * radius,
                        z
                    );
                    fragNormal = normal;

                    gl_Position = camera * vec4(
                        base + position.xy * radius,
                        z,
                        1.0
                    );
                }
            `,

            frag: `
                precision mediump float;

                uniform vec3 baseColor, secondaryColor, highlightColor;
                uniform float height;
                uniform float highlight;
                uniform int patternIndex;
                uniform float patternSize;

                varying vec3 fragPosition;
                varying vec3 fragNormal;

                float stripePattern() {
                    return step(patternSize * 0.5, mod((
                        fragPosition.y
                        - fragPosition.x
                        + (height - fragPosition.z)
                    ), patternSize));
                }

                float stripe2Pattern() {
                    return step(patternSize * 0.5, mod((
                        fragPosition.x
                        - fragPosition.y
                        + (height - fragPosition.z)
                    ), patternSize));
                }

                float checkerPattern() {
                    vec3 cellPosition = vec3(0, 0, height) - fragPosition;
                    float cellSize = patternSize * 0.4;

                    vec3 cellIndex = cellPosition / cellSize;
                    float dotChoice = mod((
                        step(1.0, mod(cellIndex.x, 2.0))
                        + step(1.0, mod(cellIndex.y, 2.0))
                        + step(1.0, mod(cellIndex.z, 2.0))
                    ), 2.0);

                    return dotChoice;
                }

                float dotPattern() {
                    vec3 attachedPos = vec3(0, 0, height) - fragPosition;

                    float dotSize = patternSize * 0.3;
                    vec3 dotPosition = attachedPos + dotSize * 0.5;
                    float dotDistance = length(mod(dotPosition, dotSize) / dotSize - vec3(0.5));

                    vec3 dotIndex = dotPosition / dotSize;
                    float dotChoice = mod((
                        step(1.0, mod(dotIndex.x, 2.0))
                        + step(1.0, mod(dotIndex.y, 2.0))
                        + step(1.0, mod(dotIndex.z, 2.0))
                    ), 2.0);

                    return dotChoice * step(dotDistance, 0.5);
                }

                float pattern() {
                    if (patternIndex == 0) {
                        return stripePattern();
                    }

                    if (patternIndex == 1) {
                        return checkerPattern();
                    }

                    if (patternIndex == 2) {
                        return stripe2Pattern();
                    }

                    if (patternIndex == 3) {
                        return dotPattern();
                    }

                    return 0.0;
                }

                void main() {
                    vec3 pigmentColor = mix(baseColor, secondaryColor, pattern());

                    vec3 lightDir = vec3(-0.5, 0.5, 1.0); // non-normalized to ensure top is at 1
                    float light = max(0.0, dot(fragNormal, lightDir));

                    float highlightMix = 1.75 * max(0.0, min(0.5, highlight - 0.25)); // clip off bouncy edges of value range

                    gl_FragColor = vec4(mix(pigmentColor, highlightColor, highlightMix + (1.0 - highlightMix) * light), 1.0);
                }
            `,

            attributes: {
                position: this._regl.buffer([
                    [ -1, 1, 0 ], [ -1, -1, 0 ], [ -1, 1, 1 ], [ -1, -1, 1 ], // left face
                    [ -1, -1, 1 ], [ -1, -1, 0 ], // degen connector
                    [ -1, -1, 0 ], [ 1, -1, 0 ], [ -1, -1, 1 ], [ 1, -1, 1 ], // front face
                    [ 1, -1, 1 ], [ -1, -1, 1 ], // degen connector
                    [ -1, -1, 1 ], [ 1, -1, 1 ], [ -1, 1, 1 ], [ 1, 1, 1 ] // top face
                ]),

                normal: this._regl.buffer([
                    [ -1, 0, 0 ], [ -1, 0, 0 ], [ -1, 0, 0 ], [ -1, 0, 0 ], // left face
                    [ -1, 0, 0 ], [ 0, -1, 0 ], // degen connector
                    [ 0, -1, 0 ], [ 0, -1, 0 ], [ 0, -1, 0 ], [ 0, -1, 0 ], // front face
                    [ 0, -1, 0 ], [ 0, 0, 1 ], // degen connector
                    [ 0, 0, 1 ], [ 0, 0, 1 ], [ 0, 0, 1 ], [ 0, 0, 1 ] // top face
                ])
            },

            uniforms: {
                camera: this._regl.prop('camera'),
                base: this._regl.prop('base'),
                radius: this._regl.prop('radius'),
                height: this._regl.prop('height'),
                highlight: this._regl.prop('highlight'),
                patternIndex: this._regl.prop('patternIndex'),
                patternSize: this._regl.prop('patternSize'),
                baseColor: this._regl.prop('baseColor'),
                secondaryColor: this._regl.prop('secondaryColor'),
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

    _setBarIsActive(barIndex, status) {
        // reduce bar status state into new instance
        this.setState(state => {
            const newStatusList = state.barStatus.slice();
            newStatusList[barIndex] = status;

            return { barStatus: newStatusList };
        })
    }

    componentWillUnmount() {
        // help WebGL context get cleaned up
        this._regl.destroy();
        this._regl = null; // dereference just in case
    }

    // eslint-disable-next-line max-statements
    render() {
        const baseColor = hex2vector(this.props.baseColor);
        const secondaryColor = hex2vector(this.props.secondaryColor);
        const highlightColor = hex2vector(this.props.highlightColor);
        const labelColorCss = this.props.labelColor;

        mat4.perspective(this._cameraMat4, 0.5, this._width / this._height, 1, this._chartAreaW * 10);

        // camera distance
        vec3.set(this._cameraPositionVec3, 0, 0, -this._chartAreaH * 4);
        mat4.translate(this._cameraMat4, this._cameraMat4, this._cameraPositionVec3);

        // camera orbit pitch and yaw
        mat4.rotateX(this._cameraMat4, this._cameraMat4, -1.0);
        mat4.rotateZ(this._cameraMat4, this._cameraMat4, Math.PI / 6);

        // camera offset
        vec3.set(this._cameraPositionVec3, 0, 0, -this._chartAreaH / 2);
        mat4.translate(this._cameraMat4, this._cameraMat4, this._cameraPositionVec3);

        // chart 3D layout
        const barCellSize = this._chartAreaW / this.state.series.length;
        const barRadius = Math.max(this._barSpacing / 2, barCellSize / 2 - this._barSpacing); // padding of 10px
        const startX = -barCellSize * (this.state.series.length - 1) / 2;

        // animation setup (as single instance to help render scene in one shot)
        const motionDefaultStyle = {};
        const motionStyle = {};

        this.state.series.forEach((value, index) => {
            motionDefaultStyle[`v${index}`] = 0;
            motionStyle[`v${index}`] = spring(value, { stiffness: 320, damping: 12 });

            motionDefaultStyle[`r${index}`] = 0;
            motionStyle[`r${index}`] = spring(
                this.state.barStatus[index] ? this._barExtraRadius : 0, // @todo just animate in 0..1 range
                { stiffness: 600, damping: 18 }
            );
        });

        // CSS 3D helper
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
            <Motion
                defaultStyle={motionDefaultStyle}
                style={motionStyle}
            >{motion => {
                if (!this._regl) {
                    return null;
                }

                // chart bar display
                this.state.series.forEach((value, index) => {
                    const motionValue = motion[`v${index}`];
                    const motionExtraRadius = motion[`r${index}`];

                    vec2.set(this._barBaseVec2, (index * barCellSize) + startX, barRadius - 40);

                    this._barCommand({
                        camera: this._cameraMat4,
                        base: this._barBaseVec2,
                        radius: barRadius + motionExtraRadius,
                        height: this._chartAreaH * motionValue,
                        highlight: motionExtraRadius / this._barExtraRadius,
                        patternIndex: index % 4,
                        patternSize: this._patternSize,
                        baseColor: baseColor,
                        secondaryColor: secondaryColor,
                        highlightColor: highlightColor
                    });
                });

                // no element actually displayed
                return null;
            }}</Motion>

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
                {renderOverlaySpan(`translate(${-this._chartAreaW / 2 + 10}px, -60px)`, {
                    whiteSpace: 'nowrap',

                    fontFamily: 'Michroma, Arial, sans-serif',
                    fontSize: '40px',
                    lineHeight: 1,
                    letterSpacing: '-2px',
                    color: labelColorCss
                }, this.props.xLabel)}

                {renderOverlaySpan(`translate(${this._chartAreaW / 2 + 10}px, -40px) rotateX(90deg) rotateZ(90deg)`, {
                    whiteSpace: 'nowrap',

                    fontFamily: 'Michroma, Arial, sans-serif',
                    fontSize: '48px',
                    lineHeight: 1,
                    letterSpacing: '-2px',
                    color: labelColorCss
                }, this.props.yLabel)}

                {renderOverlaySpan(`translate3d(${-this._chartAreaW / 2}px, -40px, ${this._chartAreaH}px) rotateX(90deg)`, {
                    display: 'flex',
                    width: this._chartAreaW + 'px',
                    height: this._chartAreaH + 'px'
                }, this.state.series.map((value, index) => <span key={index} style={{
                    display: 'block',
                    flex: '1'
                }} onMouseEnter={() => {
                    this._setBarIsActive(index, true);

                    bumpSound.play();
                }} onMouseLeave={() => {
                    this._setBarIsActive(index, false);
                }} />))}
            </div>
        </div>;
    }
}

export default BarChart3D;
