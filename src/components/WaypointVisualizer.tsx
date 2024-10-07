// src/components/WaypointVisualizer.tsx
import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Gizmos/gizmoManager';
import '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Maths/math.vector';

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
  const splineRef = useRef<BABYLON.LinesMesh | null>(null);
  const conesRef = useRef<BABYLON.Mesh[]>([]); // Reference to cone meshes
  const gizmosRef = useRef<{
    positionGizmos: BABYLON.PositionGizmo[];
    rotationGizmos: BABYLON.RotationGizmo[];
  }>({
    positionGizmos: [],
    rotationGizmos: [],
  });

  useEffect(() => {
    if (!scene) return;

    // Initialize GizmoManager
    const gizmoManager = new BABYLON.GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = false; // We'll handle gizmos individually
    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.usePointerToAttachGizmos = false;

    return () => {
      gizmoManager.dispose();
    };
  }, [scene]);

  useEffect(() => {
    if (!scene || !isEditMode) return;

    // Create or update spheres for waypoints
    spheresRef.current = waypoints.map((wp, index) => {
      let sphere = scene.getMeshByName(`waypoint-${index}`) as BABYLON.Mesh;
      if (!sphere) {
        sphere = BABYLON.MeshBuilder.CreateSphere(
          `waypoint-${index}`,
          { diameter: 0.2 },
          scene
        );
        sphere.material = new BABYLON.StandardMaterial(
          `waypoint-material-${index}`,
          scene
        );
      }
      sphere.position = new BABYLON.Vector3(wp.x, wp.y, wp.z);
      sphere.rotationQuaternion = wp.rotation.clone();
      (sphere.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0); // Red

      // Add click event to sphere
      if (!sphere.actionManager) {
        sphere.actionManager = new BABYLON.ActionManager(scene);
      }
      sphere.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            toggleGizmos(index);
          }
        )
      );

      // Ensure sphere is visible in edit mode
      sphere.setEnabled(true);

      // Handle cone creation and parenting
      createCone(sphere, wp.rotation, index);

      return sphere;
    });

    // Create spline path
    createSplinePath();

    return () => {
      // Cleanup spheres, spline, and cones
      spheresRef.current.forEach((sphere) => {
        // Dispose cone attached to sphere
        const cone = scene.getMeshByName(`waypoint-cone-${sphere.name.split('-')[1]}`);
        if (cone) cone.dispose();
        sphere.dispose();
      });
      if (splineRef.current) splineRef.current.dispose();
      conesRef.current = [];

      gizmosRef.current.positionGizmos.forEach((gizmo) => gizmo.dispose());
      gizmosRef.current.rotationGizmos.forEach((gizmo) => gizmo.dispose());
      gizmosRef.current.positionGizmos = [];
      gizmosRef.current.rotationGizmos = [];
    };
  }, [scene, waypoints, isEditMode]);


  // Function to create Catmull-Rom spline and render it
  const createSplinePath = () => {
    // Dispose of existing spline
    if (splineRef.current) {
      splineRef.current.dispose();
    }

    if (waypoints.length < 2) return; // Need at least two points for a path

    // Create control points from waypoints
    const controlPoints = waypoints.map(
      (wp) => new BABYLON.Vector3(wp.x, wp.y, wp.z)
    );

    // Create Catmull-Rom spline curve
    const curve = BABYLON.Curve3.CreateCatmullRomSpline(
      controlPoints,
      50,
      false
    ); // 50 points for smoothness
    const splinePoints = curve.getPoints();

    // Create LinesMesh to represent the spline without specifying colors
    splineRef.current = BABYLON.MeshBuilder.CreateLines(
      'spline-path',
      {
        points: splinePoints,
        updatable: true,
        // Remove 'colors' to prevent mismatch error
      },
      scene
    );

    if (splineRef.current) {
      splineRef.current.color = new BABYLON.Color3(0, 1, 1); // Cyan
      splineRef.current.isPickable = false;
      splineRef.current.renderingGroupId = 1; // Optional: Adjust rendering order
    }
  };


// Function to create or update a single cone for a waypoint
const createCone = (
  sphere: BABYLON.Mesh,
  rotation: BABYLON.Quaternion,
  index: number
) => {
  const coneName = `waypoint-cone-${index}`;
  let cone = scene.getMeshByName(coneName) as BABYLON.Mesh;

  if (!cone) {
    // Create the cone
    cone = BABYLON.MeshBuilder.CreateCylinder(
      coneName,
      {
        diameterTop: 0,
        diameterBottom: 0.1,
        height: 0.3,
        tessellation: 32,
      },
      scene
    );

    // Rotate the cone to point forward (+Z axis)
    cone.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);

    // Position the cone so that it emanates from the center of the sphere
    cone.position = new BABYLON.Vector3(0, 0, 0.15); // Half the height to align with the sphere's center

    // Assign an orange material to the cone
    const coneMaterial = new BABYLON.StandardMaterial(
      `${coneName}-material`,
      scene
    );
    coneMaterial.diffuseColor = new BABYLON.Color3(1, 0.4, 0); // Orange
    cone.material = coneMaterial;

    // Parent the cone directly to the sphere
    cone.parent = sphere;
  } else {
    // If the cone already exists, ensure it's correctly oriented
    // This is generally handled by parenting, so no additional rotation is needed
    // However, if you have dynamic changes, you might need to update its orientation here
  }
};




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
      const newRot = sphere.rotationQuaternion as BABYLON.Quaternion;
      updateWaypointRotation(index, newRot);
    });

    // Store the gizmos
    gizmosRef.current.positionGizmos[index] = positionGizmo;
    gizmosRef.current.rotationGizmos[index] = rotationGizmo;
  };

  const updateWaypointPosition = (
    index: number,
    newPosition: BABYLON.Vector3
  ) => {
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
    // Spline and cones will update via useEffect
  };

  const updateWaypointRotation = (
    index: number,
    newRotation: BABYLON.Quaternion
  ) => {
    setWaypoints((prevWaypoints) => {
      const newWaypoints = [...prevWaypoints];
      newWaypoints[index] = {
        ...newWaypoints[index],
        rotation: newRotation.clone(),
      };
      return newWaypoints;
    });
    // Spline remains unaffected; cones will update via useEffect
  };

  return (
    <>
      {isEditMode && (
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
          <div
            style={{
              position: 'absolute',
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            <h3>Instructions:</h3>
            <ul>
              <li>Click on a sphere to reveal its gizmos.</li>
              <li>Use the position gizmo (arrows) to move the waypoint.</li>
              <li>Use the rotation gizmo (rotation rings) to rotate the waypoint.</li>
              <li>Click the sphere again to hide gizmos.</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default WaypointVisualizer;
