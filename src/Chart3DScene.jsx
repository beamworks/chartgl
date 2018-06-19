import React from 'react';
import { mat4, vec3 } from 'gl-matrix';

class Chart3DScene extends React.PureComponent {
    constructor() {
        super();

        // reusable computation elements
        this._cameraMat4 = mat4.create();
        this._cameraPositionVec3 = vec3.create();
    }

    render() {
        mat4.perspective(this._cameraMat4, 0.5, this.props.viewportWidth / this.props.viewportHeight, 1, this.props.distance * 2.5);

        // camera distance
        vec3.set(this._cameraPositionVec3, 0, 0, -this.props.distance);
        mat4.translate(this._cameraMat4, this._cameraMat4, this._cameraPositionVec3);

        // camera orbit pitch and yaw
        mat4.rotateX(this._cameraMat4, this._cameraMat4, -1.0);
        mat4.rotateZ(this._cameraMat4, this._cameraMat4, Math.PI / 6);

        // camera offset
        vec3.set(this._cameraPositionVec3, -this.props.centerX, -this.props.centerY, -this.props.centerZ);
        mat4.translate(this._cameraMat4, this._cameraMat4, this._cameraPositionVec3);

        const cameraCssMat = `matrix3d(${this._cameraMat4.join(', ')})`;

        // not clipping contents on root div to allow custom overlay content to spill out
        return <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
            }}
        >
            <canvas
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                }}
                width={this.props.viewportWidth}
                height={this.props.viewportHeight}
                ref={this.props.canvasRef}
            />

            <div style={{
                position: 'absolute',
                zIndex: 0, // reset stacking context
                top: 0,
                left: 0,

                // apply camera matrix, center transform and emulate WebGL device coord range (-1, 1)
                transformStyle: 'preserve-3d'
            }} ref={(node) => {
                if (node) {
                    const realViewWidth = node.parentElement.offsetWidth;
                    const realViewHeight = node.parentElement.offsetHeight;

                    node.style.transform = `
                        translate(${realViewWidth / 2}px, ${realViewHeight / 2}px)
                        scale(${realViewWidth / 2}, ${-realViewHeight / 2})
                        ${cameraCssMat}
                    `;
                }
            }}>
                {Object.keys(this.props.content3d).map(modelTransform => <div
                    key={modelTransform}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,

                        // transform in the XY plane, flipping first
                        transformStyle: 'preserve-3d',
                        transformOrigin: '0 0',
                        transform: `${modelTransform} scale(1, -1)`
                    }}
                >{this.props.content3d[modelTransform]}</div>)}
            </div>

            {/* custom overlay content */}
            {this.props.children(this._cameraMat4, cameraCssMat)}
        </div>;
    }
}

export default Chart3DScene;
