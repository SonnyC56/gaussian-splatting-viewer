import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Gizmos/positionGizmo';
import '@babylonjs/core/Gizmos/rotationGizmo';

interface Waypoint {
  x: number;
  y: number;
  z: number;
  rotation: BABYLON.Quaternion;
  interactions: any[];
}

interface WaypointVisualizerProps {
  scene: BABYLON.Scene;
  waypoints: Waypoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
  isEditMode: boolean;
}

const WaypointVisualizer: React.FC<WaypointVisualizerProps> = ({ scene, waypoints, setWaypoints, isEditMode }) => {
  const spheresRef = useRef<BABYLON.Mesh[]>([]);
  const linesRef = useRef<BABYLON.LinesMesh | null>(null);
  const gizmosRef = useRef<BABYLON.PositionGizmo[]>([]);
  const rotationGizmosRef = useRef<BABYLON.RotationGizmo[]>([]);
  const gizmoManagerRef = useRef<BABYLON.GizmoManager | null>(null);

  useEffect(() => {
    if (!scene || !isEditMode) return;

    // Create a gizmo manager
    gizmoManagerRef.current = new BABYLON.GizmoManager(scene);
    gizmoManagerRef.current.positionGizmoEnabled = true;
    gizmoManagerRef.current.rotationGizmoEnabled = true;
    gizmoManagerRef.current.attachableMeshes = [];

    // Create spheres and gizmos for waypoints
    spheresRef.current = waypoints.map((wp, index) => {
      const sphere = BABYLON.MeshBuilder.CreateSphere(`waypoint-${index}`, { diameter: 0.2 }, scene);
      sphere.position = new BABYLON.Vector3(wp.x, wp.y, wp.z);
      sphere.rotationQuaternion = wp.rotation.clone();
      sphere.material = new BABYLON.StandardMaterial(`waypoint-material-${index}`, scene);
      (sphere.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0);

      const positionGizmo = new BABYLON.PositionGizmo();
      positionGizmo.attachedMesh = sphere;
      positionGizmo.updateGizmoPositionToMatchAttachedMesh = true;
      positionGizmo.scaleRatio = 1;

      const rotationGizmo = new BABYLON.RotationGizmo();
      rotationGizmo.attachedMesh = sphere;
      rotationGizmo.updateGizmoRotationToMatchAttachedMesh = true;
      rotationGizmo.scaleRatio = .5;

      positionGizmo.onDragEndObservable.add(() => {
        updateWaypointPosition(index, sphere.position);
      });

      rotationGizmo.onDragEndObservable.add(() => {
        updateWaypointRotation(index, sphere.rotationQuaternion as BABYLON.Quaternion);
      });

      gizmosRef.current.push(positionGizmo);
      rotationGizmosRef.current.push(rotationGizmo);
      if (gizmoManagerRef.current && gizmoManagerRef.current.attachableMeshes) {
        gizmoManagerRef.current.attachableMeshes.push(sphere);
      }

      return sphere;
    });

    // Create lines connecting waypoints
    updateLines();

    return () => {
      // Cleanup
      spheresRef.current.forEach(sphere => sphere.dispose());
      gizmosRef.current.forEach(gizmo => gizmo.dispose());
      rotationGizmosRef.current.forEach(gizmo => gizmo.dispose());
      if (linesRef.current) linesRef.current.dispose();
      if (gizmoManagerRef.current) gizmoManagerRef.current.dispose();
    };
  }, [scene, waypoints, isEditMode, setWaypoints]);

  const updateWaypointPosition = (index: number, newPosition: BABYLON.Vector3) => {
    setWaypoints(prevWaypoints => {
      const newWaypoints = [...prevWaypoints];
      newWaypoints[index] = {
        ...newWaypoints[index],
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z
      };
      return newWaypoints;
    });
    updateLines();
  };

  const updateWaypointRotation = (index: number, newRotation: BABYLON.Quaternion) => {
    setWaypoints(prevWaypoints => {
      const newWaypoints = [...prevWaypoints];
      newWaypoints[index] = {
        ...newWaypoints[index],
        rotation: newRotation
      };
      return newWaypoints;
    });
  };

  const updateLines = () => {
    if (linesRef.current) linesRef.current.dispose();

    const points = waypoints.map(wp => new BABYLON.Vector3(wp.x, wp.y, wp.z));
    linesRef.current = BABYLON.MeshBuilder.CreateLines("waypoint-lines", { points }, scene);
    if (linesRef.current) {
      linesRef.current.color = new BABYLON.Color3(0, 1, 0);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      updateLines();
      spheresRef.current.forEach((sphere, index) => {
        sphere.setEnabled(true);
        sphere.position = new BABYLON.Vector3(waypoints[index].x, waypoints[index].y, waypoints[index].z);
        sphere.rotationQuaternion = waypoints[index].rotation.clone();
      });
      gizmosRef.current.forEach(gizmo => gizmo.attachedMesh?.setEnabled(true));
      rotationGizmosRef.current.forEach(gizmo => gizmo.attachedMesh?.setEnabled(true));
      if (linesRef.current) linesRef.current.setEnabled(true);
    } else {
      // Hide visualization when not in edit mode
      spheresRef.current.forEach(sphere => sphere.setEnabled(false));
      gizmosRef.current.forEach(gizmo => gizmo.attachedMesh?.setEnabled(false));
      rotationGizmosRef.current.forEach(gizmo => gizmo.attachedMesh?.setEnabled(false));
      if (linesRef.current) linesRef.current.setEnabled(false);
    }
  }, [waypoints, isEditMode, scene]);

  // Add a directional arrow to visualize rotation
  useEffect(() => {
    if (!isEditMode) return;

    waypoints.forEach((wp, index) => {
      const arrowName = `waypoint-arrow-${index}`;
      let arrow = scene.getMeshByName(arrowName);

      if (!arrow) {
        arrow = BABYLON.MeshBuilder.CreateCylinder(arrowName, {
          height: 0.4,
          diameterTop: 0,
          diameterBottom: 0.1,
        }, scene);
        arrow.material = new BABYLON.StandardMaterial(`${arrowName}-material`, scene);
        (arrow.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, .4, 0);
      }

      arrow.position = new BABYLON.Vector3(wp.x, wp.y, wp.z);
      arrow.rotationQuaternion = wp.rotation.clone();
      arrow.translate(BABYLON.Axis.Z, 0.2, BABYLON.Space.LOCAL);
      arrow.rotate(BABYLON.Axis.X, Math.PI / 2);
      arrow.setEnabled(true);
    });

    return () => {
      waypoints.forEach((_, index) => {
        const arrow = scene.getMeshByName(`waypoint-arrow-${index}`);
        if (arrow) {
          arrow.setEnabled(false);
        }
      });
    };
  }, [waypoints, isEditMode, scene]);

  return null; // This component doesn't render anything directly
};

export default WaypointVisualizer;