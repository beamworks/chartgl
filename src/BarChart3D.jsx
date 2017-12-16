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

class BarChart3D extends React.PureComponent {
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
            barIsActive: this._values.map(() => false),
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
        this._barBaseVec2 = vec2.create();
        this._barTopVec3 = vec3.create();
    }

    _setBarIsActive(index, status) {
        // reduce bar status state into new instance
        this.setState(state => ({
            barIsActive: [].concat(
                state.barIsActive.slice(0, index),
                [ !!status ],
                state.barIsActive.slice(index + 1)
            )
        }));
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

    // eslint-disable-next-line max-statements
    render() {
        const baseColor = hex2vector(this.props.baseColor);
        const secondaryColor = hex2vector(this.props.secondaryColor);
        const highlightColor = hex2vector(this.props.highlightColor);
        const labelColorCss = this.props.labelColor;

        // chart 3D layout
        const barCellSize = this._chartAreaW / this._values.length;
        const barRadius = Math.max(this._barSpacing / 2, barCellSize / 2 - this._barSpacing); // padding of 10px
        const startX = -barCellSize * (this._values.length - 1) / 2;

        // animation setup (as single instance to help render scene in one shot)
        const motionDefaultStyle = {};
        const motionStyle = {};

        this._values.forEach((value, index) => {
            const isActive = this.state.barIsActive[index];

            motionDefaultStyle[`v${index}`] = 0;
            motionStyle[`v${index}`] = spring(value, { stiffness: 320, damping: 12 });

            motionDefaultStyle[`r${index}`] = 0;
            motionStyle[`r${index}`] = spring(
                isActive ? this._barExtraRadius : 0, // @todo just animate in 0..1 range
                { stiffness: 600, damping: 18 }
            );
        });

        return <Chart3DScene
            viewportWidth={this._width}
            viewportHeight={this._height}
            distance={this._chartAreaH * 4}
            centerX={0}
            centerY={0}
            centerZ={this._chartAreaH / 2}
            canvasRef={this._handleCanvasRef}
            content3d={{
                [`translate3d(${-this._chartAreaW / 2}px, -40px, ${this._chartAreaH}px) rotateX(90deg)`]: (
                    this._values.map((value, index) => <div
                        key={index}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100px', // non-fractional size for better precision via scaling
                            height: this._chartAreaH + 'px',

                            // prevent from showing on mobile tap hover
                            // @todo reconsider for a11y
                            WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',

                            transformOrigin: '0 0',
                            transform: `translate(${index * barCellSize}px, 0px) scale(${barCellSize / 100}, 1)`
                        }}
                        onMouseEnter={() => { this._setBarIsActive(index, true); }}
                        onMouseLeave={() => { this._setBarIsActive(index, false); }}
                        onClick={() => {
                            if (this.props.onBarClick) {
                                this.props.onBarClick(index);
                            }
                        }}
                    />)
                ),

                [`translate(${-this._chartAreaW / 2 + 10}px, -60px)`]: (
                    <div style={{
                        whiteSpace: 'nowrap',

                        fontFamily: 'Michroma, Arial, sans-serif',
                        fontSize: '40px',
                        lineHeight: 1,
                        letterSpacing: '-2px',
                        color: labelColorCss
                    }}>{this.props.xLabel}</div>
                ),

                [`translate(${this._chartAreaW / 2 + 10}px, -40px) rotateX(90deg) rotateZ(90deg)`]: (
                    <div style={{
                        whiteSpace: 'nowrap',

                        fontFamily: 'Michroma, Arial, sans-serif',
                        fontSize: '48px',
                        lineHeight: 1,
                        letterSpacing: '-2px',
                        color: labelColorCss
                    }}>{this.props.yLabel}</div>
                )
            }}
        >{(cameraMat4) => <div style={{
            position: 'absolute',
            top: 0,
            left: 0
        }}>
            <Motion
                defaultStyle={motionDefaultStyle}
                style={motionStyle}
            >{motion => {
                if (!this._regl) {
                    return null;
                }

                // chart bar display
                this._values.forEach((value, index) => {
                    const motionValue = motion[`v${index}`];
                    const motionExtraRadius = motion[`r${index}`];

                    vec2.set(this._barBaseVec2, (index * barCellSize) + startX, barRadius - 40);

                    this._barCommand({
                        camera: cameraMat4,
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

            {this._values.map((value, index) => {
                // position overlay content on bar top
                vec3.set(
                    this._barTopVec3,
                    (index * barCellSize) + startX,
                    barRadius - 40,
                    value * this._chartAreaH
                );

                vec3.transformMat4(this._barTopVec3, this._barTopVec3, cameraMat4);

                // convert from GL device space (-1 .. 1) to 2D CSS space
                const x = (0.5 + 0.5 * this._barTopVec3[0]) * this._width;
                const y = (0.5 - 0.5 * this._barTopVec3[1]) * this._height;

                const barContent = this.props.renderBar && this.props.renderBar(
                    index,
                    this.state.barIsActive[index]
                );

                // set up mouse listeners on overlay content to ensure hover continuity
                return <div
                    key={index}
                    style={{
                        position: 'absolute',
                        top: `${y}px`,
                        left: `${x}px`
                    }}
                    onMouseEnter={() => { this._setBarIsActive(index, true); }}
                    onMouseLeave={() => { this._setBarIsActive(index, false); }}
                >{barContent || null}</div>;
            })}
        </div>}</Chart3DScene>;
    }
}

export default BarChart3D;
