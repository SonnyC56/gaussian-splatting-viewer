// tools/WheelHandler.ts
import * as BABYLON from "@babylonjs/core";
import { MutableRefObject } from "react";

export const wheelHandler = (
  event: WheelEvent,
  animatingToPathRef: MutableRefObject<boolean>,
  userControlRef: MutableRefObject<boolean>,
  camera: BABYLON.UniversalCamera,
  pathRef: MutableRefObject<BABYLON.Vector3[]>,
  rotations: BABYLON.Quaternion[],
  waypoints: { x: number; y: number; z: number; rotation: BABYLON.Quaternion }[],
  animationFrames: number,
  scrollSpeed: number,
  scrollTargetRef: MutableRefObject<number>,
  scrollPositionRef: MutableRefObject<number>,
  isEditMode: boolean,
  cameraConstraintMode: 'auto' | 'path',
  freeFlyEnabled: boolean,
  toggleFreeFly: () => void, // Added toggle function
) => {
  if (animatingToPathRef.current) return;
  if (isEditMode) return;

  if (
    (cameraConstraintMode === 'auto' && userControlRef.current) ||
    (cameraConstraintMode === 'path' && !freeFlyEnabled && userControlRef.current)
  ) {
    animatingToPathRef.current = true;
    userControlRef.current = false;

    // Helper function to find the closest point on the path
    function getClosestPointOnPath(
      position: BABYLON.Vector3,
      path: BABYLON.Vector3[]
    ) {
      let minDist = Infinity;
      let closestIndex = 0;
      let closestPoint = path[0] || new BABYLON.Vector3(0, 0, 0);

      for (let i = 0; i < path.length; i++) {
        const dist = BABYLON.Vector3.DistanceSquared(position, path[i]);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = i;
          closestPoint = path[i];
        }
      }

      return { index: closestIndex, closestPoint, distanceSquared: minDist };
    }

    const closestPointInfo = getClosestPointOnPath(camera.position, pathRef.current);
    const startIndex = closestPointInfo.index;
    const startPoint = closestPointInfo.closestPoint;

    // Preserve the fractional part of the scroll position
    // Calculate how far along the segment the camera is
    let fractionalScroll = 0;
    if (startIndex < pathRef.current.length - 1) {
      const segmentVector = pathRef.current[startIndex + 1].subtract(pathRef.current[startIndex]);
      const cameraVector = camera.position.subtract(pathRef.current[startIndex]);
      const segmentLengthSquared = segmentVector.lengthSquared();
      if (segmentLengthSquared > 0) {
        fractionalScroll = BABYLON.Vector3.Dot(cameraVector, segmentVector) / segmentLengthSquared;
        fractionalScroll = Math.min(Math.max(fractionalScroll, 0), 1);
      }
    }

    const targetScroll = startIndex + fractionalScroll;
    scrollPositionRef.current = targetScroll;
    scrollTargetRef.current = targetScroll;

    // Calculate target position and rotation based on current scroll position
    const targetT = targetScroll;
    const floorIndex = Math.floor(targetT);
    const ceilIndex = Math.min(floorIndex + 1, pathRef.current.length - 1);
    const lerpFactor = targetT - floorIndex;

    const targetPosition = BABYLON.Vector3.Lerp(
      pathRef.current[floorIndex],
      pathRef.current[ceilIndex],
      lerpFactor
    );

    // Calculate target rotation using Slerp for smooth interpolation
    let targetRotation: BABYLON.Quaternion;
    if (rotations.length >= 2 && pathRef.current.length >= 2) {
      const totalSegments = waypoints.length - 1;
      const segmentT = (targetT / (pathRef.current.length - 1)) * totalSegments;
      const segmentIndex = Math.floor(segmentT);
      const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
      const lerpFactorRot = segmentT - clampedSegmentIndex;

      const r1 = rotations[clampedSegmentIndex];
      const r2 = rotations[clampedSegmentIndex + 1] || rotations[rotations.length - 1];
      targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactorRot).normalize();
    } else if (rotations.length === 1) {
      targetRotation = rotations[0].clone();
    } else {
      targetRotation = camera.rotationQuaternion.clone();
    }

    // Create an animation for position
    const positionAnimation = new BABYLON.Animation(
      "cameraPositionAnimation",
      "position",
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const positionKeys = [
      { frame: 0, value: camera.position.clone() },
      { frame: animationFrames, value: targetPosition.clone() },
    ];
    positionAnimation.setKeys(positionKeys);

    // Create an animation for rotationQuaternion
    const rotationAnimation = new BABYLON.Animation(
      "cameraRotationAnimation",
      "rotationQuaternion",
      60,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const rotationKeys = [
      { frame: 0, value: camera.rotationQuaternion?.clone() || BABYLON.Quaternion.Identity() },
      { frame: animationFrames, value: targetRotation.clone() },
    ];
    rotationAnimation.setKeys(rotationKeys);

    // Add easing function for smooth transition
    const easingFunction = new BABYLON.CubicEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    positionAnimation.setEasingFunction(easingFunction);
    rotationAnimation.setEasingFunction(easingFunction);

    // Assign animations to camera
    camera.animations = [];
    camera.animations.push(positionAnimation);
    camera.animations.push(rotationAnimation);

    // Begin animations
    camera.getScene().beginAnimation(camera, 0, animationFrames, false, 1, function () {
      animatingToPathRef.current = false;
      scrollPositionRef.current = targetT;
      scrollTargetRef.current = targetT;
    });
  } else {
    // Adjust scrollTarget based on wheel delta
    scrollTargetRef.current += event.deltaY * scrollSpeed;

    // Clamp scrollTarget to the path length
    if (scrollTargetRef.current < 0) scrollTargetRef.current = 0;
    if (scrollTargetRef.current > pathRef.current.length - 1)
      scrollTargetRef.current = pathRef.current.length - 1;
  }
};
