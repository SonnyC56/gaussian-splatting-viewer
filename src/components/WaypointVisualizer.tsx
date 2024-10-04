import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Gizmos/gizmoManager';

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
  const gizmoManagerRef = useRef<BABYLON.GizmoManager | null>(null);

  useEffect(() => {
    if (!scene) return;

    // Create a single GizmoManager for the scene
    gizmoManagerRef.current = new BABYLON.GizmoManager(scene);
    gizmoManagerRef.current.positionGizmoEnabled = true;
    gizmoManagerRef.current.rotationGizmoEnabled = true;
    gizmoManagerRef.current.usePointerToAttachGizmos = false;
    gizmoManagerRef.current.attachableMeshes = [];

    return () => {
      if (gizmoManagerRef.current) {
        gizmoManagerRef.current.dispose();
      }
    };
  }, [scene]);

  useEffect(() => {
    if (!scene || !isEditMode) return;

    // Create or update spheres for waypoints
    spheresRef.current = waypoints.map((wp, index) => {
      let sphere = scene.getMeshByName(`waypoint-${index}`) as BABYLON.Mesh;
      if (!sphere) {
        sphere = BABYLON.MeshBuilder.CreateSphere(`waypoint-${index}`, { diameter: 0.2 }, scene);
        sphere.material = new BABYLON.StandardMaterial(`waypoint-material-${index}`, scene);
      }
      sphere.position = new BABYLON.Vector3(wp.x, wp.y, wp.z);
      sphere.rotationQuaternion = wp.rotation.clone();
      (sphere.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0);

      // Add click event to sphere
      sphere.actionManager = new BABYLON.ActionManager(scene);
      sphere.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
          if (gizmoManagerRef.current) {
            gizmoManagerRef.current.attachToMesh(sphere);
          }
        })
      );

      return sphere;
    });

    // Update gizmo manager
    if (gizmoManagerRef.current) {
      gizmoManagerRef.current.attachableMeshes = spheresRef.current;
    }

    // Create lines connecting waypoints
    updateLines();

    return () => {
      // Cleanup
      spheresRef.current.forEach(sphere => sphere.dispose());
      if (linesRef.current) linesRef.current.dispose();
    };
  }, [scene, waypoints, isEditMode, setWaypoints]);

  useEffect(() => {
    if (gizmoManagerRef.current) {
      gizmoManagerRef.current.onAttachedToMeshObservable.add((mesh) => {
        if (mesh) {
          const index = spheresRef.current.findIndex(sphere => sphere === mesh);
          if (index !== -1) {
            gizmoManagerRef.current!.gizmos.positionGizmo!.onDragEndObservable.add(() => {
              updateWaypointPosition(index, mesh.position);
            });
            gizmoManagerRef.current!.gizmos.rotationGizmo!.onDragEndObservable.add(() => {
              updateWaypointRotation(index, mesh.rotationQuaternion as BABYLON.Quaternion);
            });
          }
        }
      });
    }
  }, [setWaypoints]);

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
      if (linesRef.current) linesRef.current.setEnabled(true);
      if (gizmoManagerRef.current) gizmoManagerRef.current.attachToMesh(null);
    } else {
      // Hide visualization when not in edit mode
      spheresRef.current.forEach(sphere => sphere.setEnabled(false));
      if (linesRef.current) linesRef.current.setEnabled(false);
      if (gizmoManagerRef.current) gizmoManagerRef.current.attachToMesh(null);
    }
  }, [waypoints, isEditMode, scene]);

  // Add a directional arrow to visualize rotation
  useEffect(() => {
    if (!isEditMode) return;

    waypoints.forEach((wp, index) => {
      const arrowName = `waypoint-arrow-${index}`;
      let arrow = scene.getMeshByName(arrowName) as BABYLON.Mesh;

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
if(!isEditMode || gizmoManagerRef.current?.attachedMesh){
  return null; // This component doesn't render anything directly
} else {

  //add a instructions component 
    return (
        <div style={{ position: 'absolute', bottom: 300, left: 0, width: '100%',  display: 'flex',  justifyContent: 'center'}}>
        <div style={{ position: 'absolute', color: 'white' }}>
            <h1>Click Sphere to Reveal Gizmo</h1>
        </div>
        </div>
    );
}

};

export default WaypointVisualizer;