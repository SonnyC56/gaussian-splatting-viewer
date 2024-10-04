import * as BABYLON from "@babylonjs/core";

const addTooltipToMesh = (mesh:  BABYLON.Mesh, text: string, scene: BABYLON.Scene) => {
    mesh.actionManager = new BABYLON.ActionManager(scene);

    let tooltip: HTMLDivElement | null = null;
    let pointerMoveHandler: ((evt: PointerEvent) => void) | null = null;

    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        () => {
          // Show tooltip
          tooltip = document.createElement("div");
          tooltip.id = "tooltip";
          tooltip.innerText = text;
          tooltip.style.position = "absolute";
          tooltip.style.backgroundColor = "rgba(0,0,0,0.7)";
          tooltip.style.color = "white";
          tooltip.style.padding = "5px";
          tooltip.style.borderRadius = "5px";
          tooltip.style.pointerEvents = "none";
          tooltip.style.zIndex = "15";
          document.body.appendChild(tooltip);

          pointerMoveHandler = function (evt) {
            if (tooltip) {
              tooltip.style.left = evt.clientX + 10 + "px";
              tooltip.style.top = evt.clientY + 10 + "px";
            }
          };
          window.addEventListener("pointermove", pointerMoveHandler);
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
            window.removeEventListener("pointermove", pointerMoveHandler);
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
        window.removeEventListener("pointermove", pointerMoveHandler);
        pointerMoveHandler = null;
      }
    });
  };

  export default addTooltipToMesh;