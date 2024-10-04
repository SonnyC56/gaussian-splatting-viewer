import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Gizmos/positionGizmo';

interface Waypoint {
  x: number;
  y: number;
  z: number;
  rotation: BABYLON.Quaternion;
  interactions: any[]; // You may want to define a more specific type for interactions
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
  const gizmoManagerRef = useRef<BABYLON.GizmoManager | null>(null);

  useEffect(() => {
    if (!scene || !isEditMode) return;

    // Create a gizmo manager
    gizmoManagerRef.current = new BABYLON.GizmoManager(scene);
    gizmoManagerRef.current.positionGizmoEnabled = true;
    gizmoManagerRef.current.attachableMeshes = [];

    // Create spheres and gizmos for waypoints
    spheresRef.current = waypoints.map((wp, index) => {
      const sphere = BABYLON.MeshBuilder.CreateSphere(`waypoint-${index}`, { diameter: 0.2 }, scene);
      sphere.position = new BABYLON.Vector3(wp.x, wp.y, wp.z);
      sphere.material = new BABYLON.StandardMaterial(`waypoint-material-${index}`, scene);
      (sphere.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0);

      const gizmo = new BABYLON.PositionGizmo();
      gizmo.attachedMesh = sphere;
      gizmo.updateGizmoPositionToMatchAttachedMesh = true;
      gizmo.scaleRatio = 1;

      gizmo.onDragStartObservable.add(() => {
        if (sphere.material instanceof BABYLON.StandardMaterial) {
          sphere.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
        }
      });

      gizmo.onDragEndObservable.add(() => {
        if (sphere.material instanceof BABYLON.StandardMaterial) {
          sphere.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        }
        updateWaypointPosition(index, sphere.position);
      });

      gizmosRef.current.push(gizmo);
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
      gizmosRef.current.forEach(gizmo => {
        if (gizmo.attachedMesh) {
          gizmo.attachedMesh.setEnabled(true);
        }
      });
    } else {
      // Hide or remove visualization when not in edit mode
      spheresRef.current.forEach(sphere => sphere.setEnabled(false));
      gizmosRef.current.forEach(gizmo => {
        if (gizmo.attachedMesh) {
          gizmo.attachedMesh.setEnabled(false);
        }
      });
      if (linesRef.current) linesRef.current.setEnabled(false);
    }
  }, [waypoints, isEditMode, scene]);

  return null; // This component doesn't render anything directly
};

export default WaypointVisualizer;