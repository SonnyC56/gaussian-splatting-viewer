export const generateExportedHTML = (
  modelUrl: string,
  includeUI: boolean,
  waypoints: Array<{
    x: number;
    y: number;
    z: number;
    rotation: { x: number; y: number; z: number; w: number };
    interactions: Array<{ type: string; data: any }>;
  }>,
  backgroundColor: string,
  cameraMovementSpeed: number,
  cameraRotationSensitivity: number,
  scrollSpeed: number,
  animationFrames: number
) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Exported Scene</title>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; }
    #renderCanvas { width: 100%; height: 100%; touch-action: none; }
    ${
      includeUI
        ? `
    .ui-overlay {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: rgba(0,0,0,0.7);
      padding: 10px;
      border-radius: 5px;
      color: white;
      z-index: 10;
    }
    `
        : ""
    }
    #infoPopupOverlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      display: none;
    }
    #infoPopup {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    #closePopup {
      margin-top: 15px;
      padding: 8px 16px;
      background-color: #007BFF;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  ${
    includeUI
      ? `
  <div class="ui-overlay">
    <p>Use W/A/S/D to move, mouse to look around.</p>
    <p>Scroll to move along the path.</p>
  </div>
  `
      : ""
  }
  <div id="infoPopupOverlay">
    <div id="infoPopup">
      <p id="infoPopupText"></p>
      <button id="closePopup">Close</button>
    </div>
  </div>
  <!-- Babylon.js CDN -->
  <script src="https://cdn.babylonjs.com/babylon.js"></script>
  <script src="https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
  <script>
    // Get the canvas element
    const canvas = document.getElementById('renderCanvas');

    // Generate the Babylon.js 3D engine
    const engine = new BABYLON.Engine(canvas, true);

    // Create the scene
    const scene = new BABYLON.Scene(engine);

    // Set the background color
    scene.clearColor = BABYLON.Color3.FromHexString('${backgroundColor}').toColor4(1);

    // Create a universal camera and position it
    const camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(${waypoints[0].x}, ${waypoints[0].y}, ${waypoints[0].z}),
      scene
    );
    camera.attachControl(canvas, true);

    // Adjust camera sensitivity
    camera.speed = ${cameraMovementSpeed};
    camera.angularSensibility = ${cameraRotationSensitivity};

    // Enable WASD keys for movement
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysRight.push(68); // D

    // Create a basic light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    // Variables to manage camera control state
    let userControl = false;
    let animatingToPath = false;

    // Variables for scroll position and target
    let scrollPosition = 0;
    let scrollTarget = 0.01; // Start with a small value to enable scrolling

    // InfoPopup functionality
    const infoPopupOverlay = document.getElementById('infoPopupOverlay');
    const infoPopupText = document.getElementById('infoPopupText');
    const closePopupButton = document.getElementById('closePopup');

    function showInfoPopup(text) {
      infoPopupText.textContent = text;
      infoPopupOverlay.style.display = 'flex';
    }

    function hideInfoPopup() {
      infoPopupOverlay.style.display = 'none';
    }

    closePopupButton.addEventListener('click', hideInfoPopup);

    // Function to add hover interaction
    const addHoverInteraction = (mesh) => {
      mesh.actionManager = new BABYLON.ActionManager(scene);

      let tooltip = null;
      let pointerMoveHandler = null;

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          () => {
            // Show tooltip
            tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.innerText = 'Hot spot example';
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'rgba(0,0,0,0.7)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '5px';
            tooltip.style.borderRadius = '5px';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.zIndex = '15';
            document.body.appendChild(tooltip);

            pointerMoveHandler = function (evt) {
              if (tooltip) {
                tooltip.style.left = evt.clientX + 10 + 'px';
                tooltip.style.top = evt.clientY + 10 + 'px';
              }
            };
            window.addEventListener('pointermove', pointerMoveHandler);
          }
        )
      );

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          () => {
            // Hide tooltip
            if (tooltip) {
              tooltip.remove();
              tooltip = null;
            }
            if (pointerMoveHandler) {
              window.removeEventListener('pointermove', pointerMoveHandler);
              pointerMoveHandler = null;
            }
          }
        )
      );

      // Cleanup when the mesh is disposed
      mesh.onDisposeObservable.add(() => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
        if (pointerMoveHandler) {
          window.removeEventListener('pointermove', pointerMoveHandler);
          pointerMoveHandler = null;
        }
      });
    };

    // Load the model file
    BABYLON.SceneLoader.ImportMeshAsync('', '', '${modelUrl}', scene)
      .then((result) => {
        const loadedMeshes = result.meshes;
        loadedMeshes.forEach((mesh) => {
          if (mesh instanceof BABYLON.Mesh) {
            mesh.position = BABYLON.Vector3.Zero();
            addHoverInteraction(mesh);
          }
        });
      })
      .catch((error) => {
        console.error('Error loading model file:', error);
        alert('Error loading model file: ' + error.message);
      });

    // Prepare waypoints and rotations
    const waypoints = ${JSON.stringify(waypoints)};
    const controlPoints = waypoints.map(
      (wp) => new BABYLON.Vector3(wp.x, wp.y, wp.z)
    );
    const rotations = waypoints.map(
      (wp) => new BABYLON.Quaternion(wp.rotation.x, wp.rotation.y, wp.rotation.z, wp.rotation.w)
    );

    let path = [];

    if (controlPoints.length >= 2) {
      const positionCurve = BABYLON.Curve3.CreateCatmullRomSpline(
        controlPoints,
        (waypoints.length - 1) * 10,
        false
      );
      path = positionCurve.getPoints();
    } else if (controlPoints.length === 1) {
      path = [controlPoints[0]];
    }

    // Handle scroll events
    window.addEventListener('wheel', (event) => {
      if (animatingToPath) return;

      if (userControl) {
        animatingToPath = true;
        userControl = false;

        if (!camera.rotationQuaternion) {
          camera.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
            camera.rotation.x,
            camera.rotation.y,
            camera.rotation.z
          );
          camera.rotation.set(0, 0, 0);
        }

        const closestPointInfo = getClosestPointOnPath(camera.position, path);
        const startIndex = closestPointInfo.index;

        const targetPosition = path[startIndex];

        let targetRotation = camera.rotationQuaternion.clone();
        if (rotations.length >= 2 && path.length >= 2) {
          const t = startIndex / (path.length - 1);
          const totalSegments = waypoints.length - 1;
          const segmentT = t * totalSegments;
          const segmentIndex = Math.floor(segmentT);
          const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
          const lerpFactor = segmentT - clampedSegmentIndex;

          const r1 = rotations[clampedSegmentIndex];
          const r2 = rotations[clampedSegmentIndex + 1] || rotations[rotations.length - 1];
          targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);
        } else if (rotations.length === 1) {
          targetRotation = rotations[0];
        }

        const positionAnimation = new BABYLON.Animation(
          'cameraPositionAnimation',
          'position',
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const positionKeys = [];
        positionKeys.push({ frame: 0, value: camera.position.clone() });
        positionKeys.push({ frame: ${animationFrames}, value: targetPosition.clone() });

        positionAnimation.setKeys(positionKeys);

        const easingFunction = new BABYLON.CubicEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        positionAnimation.setEasingFunction(easingFunction);

        const rotationAnimation = new BABYLON.Animation(
          'cameraRotationAnimation',
          'rotationQuaternion',
          60,
          BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const currentRotation = camera.rotationQuaternion.clone();
        rotationAnimation.setKeys([
          { frame: 0, value: currentRotation },
          { frame: ${animationFrames}, value: targetRotation },
        ]);

        rotationAnimation.setEasingFunction(easingFunction);

        camera.animations = [];
        camera.animations.push(positionAnimation);
        camera.animations.push(rotationAnimation);

        scene.beginAnimation(camera, 0, ${animationFrames}, false, 1, function () {
          animatingToPath = false;
          scrollPosition = startIndex;
          scrollTarget = scrollPosition;
        });
      } else {
        scrollTarget += event.deltaY * ${scrollSpeed};

        if (scrollTarget < 0) scrollTarget = 0;
        if (scrollTarget > path.length - 1) scrollTarget = path.length - 1;
      }
    });

    // Helper function
    function getClosestPointOnPath(position, path) {
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

    // Function to execute interactions
    const executeInteractions = (interactions) => {
      interactions.forEach((interaction) => {
        switch (interaction.type) {
          case "info":
            showInfoPopup(interaction.data.text);
            break;
          // Add other interaction types here if needed
        }
      });
    };

    // Function to reverse interactions
    const reverseInteractions = (interactions) => {
      interactions.forEach((interaction) => {
        switch (interaction.type) {
          case "info":
            hideInfoPopup();
            break;
          // Add other interaction types here if needed
        }
      });
    };

    // Render loop
    engine.runRenderLoop(function () {
      // Smoothly interpolate scrollPosition towards scrollTarget
      const scrollInterpolationSpeed = 0.1;
      scrollPosition += (scrollTarget - scrollPosition) * scrollInterpolationSpeed;

      if (scrollPosition < 0) scrollPosition = 0;
      if (scrollPosition > path.length - 1) scrollPosition = path.length - 1;

      if (!userControl && path.length >= 1) {
        const t = scrollPosition / (path.length - 1 || 1);

        const totalSegments = waypoints.length - 1;
        if (totalSegments >= 1) {
          const segmentT = t * totalSegments;
          const segmentIndex = Math.floor(segmentT);
          const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
          const lerpFactor = segmentT - clampedSegmentIndex;

          const newPosition = path[Math.floor(scrollPosition)];

          const r1 = rotations[clampedSegmentIndex];
          const r2 = rotations[clampedSegmentIndex + 1] || rotations[rotations.length - 1];

          const newRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);

          camera.position.copyFrom(newPosition);

          if (!camera.rotationQuaternion) {
            camera.rotationQuaternion = new BABYLON.Quaternion();
          }
          camera.rotationQuaternion.copyFrom(newRotation);

   // Check for waypoint triggers
          waypoints.forEach((wp, index) => {
            const distance = BABYLON.Vector3.Distance(
              camera.position,
              new BABYLON.Vector3(wp.x, wp.y, wp.z)
            );
            const triggerDistance = 1.0; // Define a suitable trigger distance

            if (distance <= triggerDistance) {
              executeInteractions(wp.interactions);
            } else {
              reverseInteractions(wp.interactions);
            }
          });
        } else if (rotations.length === 1) {
          camera.position.copyFrom(path[0]);
          if (!camera.rotationQuaternion) {
            camera.rotationQuaternion = new BABYLON.Quaternion();
          }
          camera.rotationQuaternion.copyFrom(rotations[0]);
        }
      }

      scene.render();
    });

    // Resize
    window.addEventListener('resize', function () {
      engine.resize();
    });

    // User interaction detection
    scene.onPointerObservable.add(function (evt) {
      if (evt.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        userControl = true;

        if (camera.rotationQuaternion) {
          camera.rotation = camera.rotationQuaternion.toEulerAngles();
          camera.rotationQuaternion = null;
        }
      }
    });

    window.addEventListener('keydown', function () {
      userControl = true;

      if (camera.rotationQuaternion) {
        camera.rotation = camera.rotationQuaternion.toEulerAngles();
        camera.rotationQuaternion = null;
      }
    });
  </script>
</body>
</html>
  `;
};