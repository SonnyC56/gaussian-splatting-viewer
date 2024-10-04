import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { Waypoint } from '../App';

interface WaypointVisualizerProps {
  scene: BABYLON.Scene;
  waypoints: Waypoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
  isEditMode: boolean;
}

const WaypointVisualizer: React.FC<WaypointVisualizerProps> = ({ scene, waypoints, setWaypoints, isEditMode }) => {
  const spheresRef = useRef<BABYLON.Mesh[]>([]);
  const linesRef = useRef<BABYLON.LinesMesh | null>(null);

  useEffect(() => {
    if (!scene || !isEditMode) return;

    // Create spheres for waypoints
    spheresRef.current = waypoints.map((wp, index) => {
      const sphere = BABYLON.MeshBuilder.CreateSphere(`waypoint-${index}`, { diameter: 0.2 }, scene);
      sphere.position = new BABYLON.Vector3(wp.x, wp.y, wp.z);
      sphere.material = new BABYLON.StandardMaterial(`waypoint-material-${index}`, scene);
      (sphere.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0);
      
      // Make spheres draggable
      const pointerDragBehavior = new BABYLON.PointerDragBehavior({ dragAxis: new BABYLON.Vector3(1, 1, 1) });
      pointerDragBehavior.onDragObservable.add((event) => {
        // Update waypoint position
        setWaypoints(prevWaypoints => {
          const newWaypoints = [...prevWaypoints];
          newWaypoints[index] = {
            ...newWaypoints[index],
            x: sphere.position.x,
            y: sphere.position.y,
            z: sphere.position.z
          };
          return newWaypoints;
        });
      });
      sphere.addBehavior(pointerDragBehavior);

      return sphere;
    });

    // Create lines connecting waypoints
    updateLines();

    return () => {
      // Cleanup
      spheresRef.current.forEach(sphere => sphere.dispose());
      if (linesRef.current) linesRef.current.dispose();
    };
  }, [scene, waypoints, isEditMode]);

  const updateLines = () => {
    if (linesRef.current) linesRef.current.dispose();

    const points = waypoints.map(wp => new BABYLON.Vector3(wp.x, wp.y, wp.z));
    linesRef.current = BABYLON.MeshBuilder.CreateLines("waypoint-lines", { points }, scene);
    linesRef.current.color = new BABYLON.Color3(0, 1, 0);
  };

  useEffect(() => {
    if (isEditMode) {
      updateLines();
    }
  }, [waypoints, isEditMode]);

  return null; // This component doesn't render anything directly
};

export default WaypointVisualizer;