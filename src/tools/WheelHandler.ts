// tools/WheelHandler.js
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
  isEditMode: boolean
) => {
  if (animatingToPathRef.current) return;

  if(isEditMode) return;

  if (userControlRef.current) {
    // Animate the camera back to the path
    animatingToPathRef.current = true;
    userControlRef.current = false;

    // Ensure rotationQuaternion is set
    if (!camera.rotationQuaternion) {
      camera.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
        camera.rotation.x,
        camera.rotation.y,
        camera.rotation.z
      );
      camera.rotation.set(0, 0, 0);
    }

    // Helper function to find the closest point on the path to the camera
    function getClosestPointOnPath(
        position: BABYLON.Vector3,
        path: BABYLON.Vector3[]
      ) {
        let minDist = Infinity;
        let closestIndex = 0;
  
        for (let i = 0; i < path.length; i++) {
          const dist = BABYLON.Vector3.DistanceSquared(position, path[i]);
          if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
          }
        }
  
        return { index: closestIndex, distanceSquared: minDist };
      }

    // Find the closest point on the path
    const closestPointInfo = getClosestPointOnPath(
      camera.position,
      pathRef.current
    );
    const startIndex = closestPointInfo.index;

    // Compute the desired position
    const targetPosition = pathRef.current[startIndex];

    // Get the corresponding rotation
    let targetRotation = camera.rotationQuaternion.clone();
    if (rotations.length >= 2 && pathRef.current.length >= 2) {
      const t = startIndex / (pathRef.current.length - 1);
      const totalSegments = waypoints.length - 1;
      const segmentT = t * totalSegments;
      const segmentIndex = Math.floor(segmentT);
      const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
      const lerpFactor = segmentT - clampedSegmentIndex;

      const r1 = rotations[clampedSegmentIndex];
      const r2 =
        rotations[clampedSegmentIndex + 1] ||
        rotations[rotations.length - 1];
      targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);
    } else if (rotations.length === 1) {
      targetRotation = rotations[0];
    }

    // Create an animation for position
    const positionAnimation = new BABYLON.Animation(
      "cameraPositionAnimation",
      "position",
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const positionKeys = [];
    positionKeys.push({ frame: 0, value: camera.position.clone() });
    positionKeys.push({
      frame: animationFrames,
      value: targetPosition.clone(),
    });

    positionAnimation.setKeys(positionKeys);

    // Add easing function
    const easingFunction = new BABYLON.CubicEase();
    easingFunction.setEasingMode(
      BABYLON.EasingFunction.EASINGMODE_EASEINOUT
    );
    positionAnimation.setEasingFunction(easingFunction);

    // Create an animation for rotationQuaternion
    const rotationAnimation = new BABYLON.Animation(
      "cameraRotationAnimation",
      "rotationQuaternion",
      60,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const currentRotation = camera.rotationQuaternion.clone();
    rotationAnimation.setKeys([
      { frame: 0, value: currentRotation },
      { frame: animationFrames, value: targetRotation },
    ]);

    rotationAnimation.setEasingFunction(easingFunction);

    // Add animations to the camera
    camera.animations = [];
    camera.animations.push(positionAnimation);
    camera.animations.push(rotationAnimation);

    camera.getScene().beginAnimation(camera, 0, animationFrames, false, 1, function () {
      animatingToPathRef.current = false;
      // Update scrollPosition to match the camera's position on the path
      scrollPositionRef.current = startIndex;
      scrollTargetRef.current = scrollPositionRef.current;
    });
  
  } else {
    // Adjust scrollTarget instead of scrollPosition directly
    scrollTargetRef.current += event.deltaY * scrollSpeed;

    // Clamp scrollTarget to the path length
    if (scrollTargetRef.current < 0) scrollTargetRef.current = 0;
    if (scrollTargetRef.current > pathRef.current.length - 1)
      scrollTargetRef.current = pathRef.current.length - 1;
  }
};