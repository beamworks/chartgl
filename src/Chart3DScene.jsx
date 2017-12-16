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

        return this.props.children(this._cameraMat4, cameraCssMat);
    }
}

export default Chart3DScene;
