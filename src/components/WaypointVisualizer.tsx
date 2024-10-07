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

const WaypointVisualizer: React.FC<WaypointVisualizerProps> = ({
  scene,
  waypoints,
  setWaypoints,
  isEditMode,
}) => {
  const spheresRef = useRef<BABYLON.Mesh[]>([]);
  const linesRef = useRef<BABYLON.LinesMesh | null>(null);
  const gizmosRef = useRef<{ positionGizmos: BABYLON.PositionGizmo[]; rotationGizmos: BABYLON.RotationGizmo[] }>({
    positionGizmos: [],
    rotationGizmos: [],
  });

  useEffect(() => {
    if (!scene) return;

    return () => {
      // Cleanup all gizmos
      gizmosRef.current.positionGizmos.forEach((gizmo) => gizmo.dispose());
      gizmosRef.current.rotationGizmos.forEach((gizmo) => gizmo.dispose());
      gizmosRef.current.positionGizmos = [];
      gizmosRef.current.rotationGizmos = [];
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
          // Toggle gizmos for the clicked sphere
          toggleGizmos(index);
        })
      );

      // Ensure sphere is visible in edit mode
      sphere.setEnabled(true);

      return sphere;
    });

    // Create lines connecting waypoints
    updateLines();

    return () => {
      // Cleanup spheres and lines
      spheresRef.current.forEach((sphere) => sphere.dispose());
      if (linesRef.current) linesRef.current.dispose();
      // Dispose of all gizmos
      gizmosRef.current.positionGizmos.forEach((gizmo) => gizmo.dispose());
      gizmosRef.current.rotationGizmos.forEach((gizmo) => gizmo.dispose());
      gizmosRef.current.positionGizmos = [];
      gizmosRef.current.rotationGizmos = [];
    };
  }, [scene, waypoints, isEditMode, setWaypoints]);

  useEffect(() => {
    if (isEditMode) {
      updateLines();
      spheresRef.current.forEach((sphere, index) => {
        sphere.setEnabled(true);
        sphere.position = new BABYLON.Vector3(waypoints[index].x, waypoints[index].y, waypoints[index].z);
        sphere.rotationQuaternion = waypoints[index].rotation.clone();
      });
      if (linesRef.current) linesRef.current.setEnabled(true);
    } else {
      // Hide visualization when not in edit mode
      spheresRef.current.forEach((sphere) => sphere.setEnabled(false));
      if (linesRef.current) linesRef.current.setEnabled(false);
      // Dispose of all gizmos
      gizmosRef.current.positionGizmos.forEach((gizmo) => gizmo.dispose());
      gizmosRef.current.rotationGizmos.forEach((gizmo) => gizmo.dispose());
      gizmosRef.current.positionGizmos = [];
      gizmosRef.current.rotationGizmos = [];
    }
  }, [waypoints, isEditMode, scene]);

  // Function to toggle gizmos for a specific waypoint
  const toggleGizmos = (index: number) => {
    const sphere = spheresRef.current[index];
    if (!sphere) return;

    // Check if gizmos already exist for this waypoint
    const existingPositionGizmo = gizmosRef.current.positionGizmos[index];
    const existingRotationGizmo = gizmosRef.current.rotationGizmos[index];

    if (existingPositionGizmo) {
      // Gizmos exist, dispose them
      existingPositionGizmo.dispose();
      existingRotationGizmo.dispose();
      gizmosRef.current.positionGizmos[index] = null!;
      gizmosRef.current.rotationGizmos[index] = null!;
      return;
    }

    // Create Position Gizmo
    const positionGizmo = new BABYLON.PositionGizmo();
    positionGizmo.attachedMesh = sphere;
    positionGizmo.updateGizmoRotationToMatchAttachedMesh = true;

    // Handle position changes
    positionGizmo.onDragEndObservable.add(() => {
      const newPos = sphere.position;
      updateWaypointPosition(index, newPos);
    });

    // Create Rotation Gizmo
    const rotationGizmo = new BABYLON.RotationGizmo();
    rotationGizmo.attachedMesh = sphere;
    rotationGizmo.updateGizmoRotationToMatchAttachedMesh = true;

    // Handle rotation changes
    rotationGizmo.onDragEndObservable.add(() => {
      const newRot = sphere.rotationQuaternion!;
      updateWaypointRotation(index, newRot);
    });

    // Store the gizmos
    gizmosRef.current.positionGizmos[index] = positionGizmo;
    gizmosRef.current.rotationGizmos[index] = rotationGizmo;
  };

  const updateWaypointPosition = (index: number, newPosition: BABYLON.Vector3) => {
    setWaypoints((prevWaypoints) => {
      const newWaypoints = [...prevWaypoints];
      newWaypoints[index] = {
        ...newWaypoints[index],
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
      };
      return newWaypoints;
    });
    updateLines();
  };

  const updateWaypointRotation = (index: number, newRotation: BABYLON.Quaternion) => {
    setWaypoints((prevWaypoints) => {
      const newWaypoints = [...prevWaypoints];
      newWaypoints[index] = {
        ...newWaypoints[index],
        rotation: newRotation.clone(),
      };
      return newWaypoints;
    });
  };

  const updateLines = () => {
    if (linesRef.current) linesRef.current.dispose();

    const points = waypoints.map((wp) => new BABYLON.Vector3(wp.x, wp.y, wp.z));
    linesRef.current = BABYLON.MeshBuilder.CreateLines('waypoint-lines', { points }, scene);
    if (linesRef.current) {
      linesRef.current.color = new BABYLON.Color3(0, 1, 0);
    }
  };

  // Add a directional arrow to visualize rotation
  useEffect(() => {
    if (!isEditMode) return;

    waypoints.forEach((wp, index) => {
      const arrowName = `waypoint-arrow-${index}`;
      let arrow = scene.getMeshByName(arrowName) as BABYLON.Mesh;

      if (!arrow) {
        arrow = BABYLON.MeshBuilder.CreateCylinder(
          arrowName,
          {
            height: 0.4,
            diameterTop: 0,
            diameterBottom: 0.1,
          },
          scene
        );
        arrow.material = new BABYLON.StandardMaterial(`${arrowName}-material`, scene);
        (arrow.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0.4, 0);
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

  // Instructions Component
  if (!isEditMode) {
    return null; // This component doesn't render anything directly
  } else {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 300,
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'absolute', color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px' }}>
          <h3>Instructions:</h3>
          <ul>
            <li>Click on a sphere to reveal its gizmos.</li>
            <li>Use the position gizmo (arrows) to move the waypoint.</li>
            <li>Use the rotation gizmo (rotation rings) to rotate the waypoint.</li>
            <li>Click the sphere again to hide gizmos.</li>
          </ul>
        </div>
      </div>
    );
  }
};

export default WaypointVisualizer;
