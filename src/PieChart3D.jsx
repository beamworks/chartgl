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

        if (values.length < 1) {
            throw new Error('missing values');
        }

        this.state = {
            sliceIsActive: values.map(() => false),
            graphicsInitialized: false
        };

        this._width = width;
        this._height = height;

        this._chartRadius = 250;
        this._chartInnerRadius = 100;
        this._chartSliceHeightMin = 30;
        this._chartSliceHeightMax = 50;
        this._startOffset = -0.2; // fraction of whole circle
        this._sliceExtraRadius = this._chartRadius * 0.06;
        this._patternSize = 50;
        this._spacingFraction = 0.02; // spacing between slices

        // copy value array, coerce to number and normalize with spacing in mind
        const valueList = [].concat(values).map(value => value * 1 || 0);
        const valuesSum = valueList.reduce((sum, value) => sum + value, 0);
        const valuesPaddedRatio = 1 + values.length * this._spacingFraction;

        this._values = valueList.map(value => (value / valuesSum + this._spacingFraction) / valuesPaddedRatio);

        this._regl = null; // initialized after first render
    }

    _setSliceIsActive(index, status) {
        // reduce bar status state into new instance
        this.setState(state => ({
            sliceIsActive: [].concat(
                state.sliceIsActive.slice(0, index),
                [ !!status ],
                state.sliceIsActive.slice(index + 1)
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
                    uniform float start, end, spacing;

                    attribute vec3 position;
                    attribute vec3 normal;

                    varying vec3 fragPosition;
                    varying vec3 fragNormal;

                    void main() {
                        float scaledPadding = spacing * mix(1.0, radius / (radius + width), position.x);
                        float azimuth = 2.0 * M_PI * (start + (end - start) * position.y - scaledPadding * (position.y - 0.5));

                        float sinA = sin(azimuth);
                        float cosA = cos(azimuth);

                        float dist = radius + position.x * width;
                        float z = position.z * height;

                        fragPosition = vec3(
                            azimuth * (radius + width * 0.5) * 1.4, // hand-tuned for highlight anim
                            (radius + width - dist),
                            z
                        );

                        // rotate normal
                        fragNormal = vec3(
                            normal.x * cosA - normal.y * sinA,
                            normal.y * cosA + normal.x * sinA,
                            normal.z
                        );

                        gl_Position = camera * vec4(
                            dist * cosA,
                            dist * sinA,
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
                    spacing: this._regl.prop('spacing'),
                    highlight: this._regl.prop('highlight'),
                    patternIndex: this._regl.prop('patternIndex'),
                    patternSize: this._regl.prop('patternSize'),
                    baseColor: this._regl.prop('baseColor'),
                    secondaryColor: this._regl.prop('secondaryColor'),
                    highlightColor: this._regl.prop('highlightColor')
                },

                primitive: 'triangle strip',
                count: (2 * segmentCount + 2) + 4 + (2 * segmentCount + 2) + 4 + 2 + (2 * segmentCount + 2)
            });
        });

        this.setState({ graphicsInitialized: true });
    }

    // eslint-disable-next-line max-statements
    render() {
        const baseColor = hex2vector(this.props.baseColor);
        const secondaryColor = hex2vector(this.props.secondaryColor);
        const highlightColor = hex2vector(this.props.highlightColor);

        const sliceHeightRange = this._chartSliceHeightMax - this._chartSliceHeightMin;
        const sortedValues = [].concat(this._values).sort();
        const maxValue = sortedValues[sortedValues.length - 1];

        const content3d = {};

        // animation setup (as single instance to help render scene in one shot)
        const motionDefaultStyle = {};
        const motionStyle = {};

        this._values.reduce((start, value, index) => {
            const end = start + value;
            const isActive = this.state.sliceIsActive[index];

            const startAngle = start * 2 * Math.PI;
            const height = this._chartSliceHeightMin + (value / maxValue) * sliceHeightRange;

            motionDefaultStyle[`h${index}`] = this._chartSliceHeightMin;
            motionStyle[`h${index}`] = spring(height, { stiffness: 320, damping: 12 });

            motionDefaultStyle[`r${index}`] = 0;
            motionStyle[`r${index}`] = spring(
                isActive ? this._sliceExtraRadius : 0, // @todo just animate in 0..1 range
                { stiffness: 600, damping: 18 }
            );

            const quadCount = Math.ceil(value * 12);
            const quadList = Array(...new Array(quadCount));
            const quadAngle = value * 2 * Math.PI / quadCount;

            const quadSpanFraction = 2 * Math.sin(quadAngle / 2);

            const cameraOrbit = Math.PI / 6; // @todo bring this in from scene component

            quadList.forEach((v, quadIndex) => {
                const quadStartAngle = startAngle + quadIndex * quadAngle;

                content3d[`
                    translate3d(0, 0, ${height}px)
                    rotate(${quadStartAngle}rad)
                    scale(1, -1)
                `] = <div style={{
                    position: 'absolute',
                    zIndex: index,
                    top: 0,
                    left: 0,
                    width: `${this._chartRadius}px`,
                    height: `${this._chartRadius}px`,
                    overflow: 'hidden',

                    // rotate to quad angle and shear to have the needed corner angle
                    transformOrigin: '0 0',
                    transform: `
                        matrix(1, 0, ${Math.cos(quadAngle)}, ${Math.sin(quadAngle)}, 0, 0)
                    `
                }}>
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',

                            // shear to be clipped into a triangle
                            transformOrigin: '0 0',
                            transform: `
                                matrix(1, 0, -1, 1, 0, 0)
                            `
                        }}
                        onMouseEnter={() => { this._setSliceIsActive(index, true); }}
                        onMouseLeave={() => { this._setSliceIsActive(index, false); }}
                    />
                </div>;

                const quadNormAngle = (quadStartAngle + quadAngle * 0.5 + 2 * Math.PI + cameraOrbit) % (2 * Math.PI);
                const outerWallIsVisible = (quadNormAngle > Math.PI);

                if (outerWallIsVisible) {
                    content3d[`
                        rotate(${quadStartAngle}rad)
                        translate3d(${this._chartRadius}px, 0, 0)
                        rotateZ(${Math.PI / 2 + quadAngle / 2}rad)
                        rotateX(-90deg)
                        scale(${quadSpanFraction}, ${height / 100})
                    `] = <div
                        style={{
                            position: 'absolute',
                            zIndex: index,
                            top: 0,
                            left: 0,
                            width: `${this._chartRadius}px`,
                            height: '100px'
                        }}
                        onMouseEnter={() => { this._setSliceIsActive(index, true); }}
                        onMouseLeave={() => { this._setSliceIsActive(index, false); }}
                    />;
                }
            });

            // set up next start
            return end;
        }, this._startOffset);

        return <Chart3DScene
            viewportWidth={this._width}
            viewportHeight={this._height}
            distance={this._chartRadius * 4.8}
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
            {/* animate when ready to render */}
            {this.state.graphicsInitialized ? <Motion
                defaultStyle={motionDefaultStyle}
                style={motionStyle}
            >{motion => {
                // general rendering refresh
                this._regl.poll();

                // clear canvas
                // @todo set colour?
                this._regl.clear({
                    depth: 1
                });

                // render slices
                // @todo sort out how the ReGL framebuffer clearing works with react-motion framerate
                this._values.reduce((start, value, index) => {
                    const end = start + value;
                    const motionHeight = motion[`h${index}`];
                    const motionExtraRadius = motion[`r${index}`];

                    this._sliceCommandList[index]({
                        camera: cameraMat4,
                        radius: this._chartInnerRadius - motionExtraRadius * 0.5,
                        width: this._chartRadius - this._chartInnerRadius + motionExtraRadius,
                        height: motionHeight,
                        start: start,
                        end: end,
                        spacing: this._spacingFraction,
                        highlight: motionExtraRadius / this._sliceExtraRadius,
                        patternIndex: index % 4,
                        patternSize: this._patternSize,
                        baseColor: baseColor,
                        secondaryColor: secondaryColor,
                        highlightColor: highlightColor
                    });

                    // set up next start
                    return end;
                }, this._startOffset);

                // manually flush
                this._regl._gl.flush();

                // no element actually displayed
                return null;
            }}</Motion> : null}
        </div>}</Chart3DScene>;
    }
}

export default PieChart3D;
