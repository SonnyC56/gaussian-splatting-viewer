import React, { useState, useEffect, useRef, forwardRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Gizmos/gizmoManager';
import Draggable from 'react-draggable';
import HotspotContentDisplay from './HotspotContentDisplay';

export interface Hotspot {
  id: string;
  position: BABYLON.Vector3;
  scale: BABYLON.Vector3;
  title: string;
  information?: string;
  photoUrl?: string;
  activationMode: 'click' | 'hover';
  color: string;
}

interface HotspotManagerProps {
  scene: BABYLON.Scene;
  camera: BABYLON.Camera;
  hotspots: Hotspot[];
  setHotspots: React.Dispatch<React.SetStateAction<Hotspot[]>>;
}

const HotspotManager = forwardRef<unknown, HotspotManagerProps>(({ scene, camera, hotspots, setHotspots }, ref) => {

  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [displayedHotspot, setDisplayedHotspot] = useState<Hotspot | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gizmoManagerRef = useRef<BABYLON.GizmoManager | null>(null);

  useEffect(() => {
    if (scene) {
      canvasRef.current = scene.getEngine().getRenderingCanvas();
      gizmoManagerRef.current = new BABYLON.GizmoManager(scene);
      gizmoManagerRef.current.positionGizmoEnabled = true;
      gizmoManagerRef.current.scaleGizmoEnabled = true;
      gizmoManagerRef.current.attachableMeshes = [];
      if(gizmoManagerRef.current.gizmos && gizmoManagerRef.current.gizmos.scaleGizmo) {
        gizmoManagerRef.current.gizmos.scaleGizmo.scaleRatio = 0.5;
      }
      renderHotspots();
    }

    return () => {
      if (gizmoManagerRef.current) {
        gizmoManagerRef.current.dispose();
      }
    };
  }, [scene, hotspots]);

  useEffect(() => {
    if (selectedHotspot && gizmoManagerRef.current) {
      const hotspotMesh = scene.getMeshByName(`hotspot-${selectedHotspot.id}`);
      if (hotspotMesh) {
        gizmoManagerRef.current.attachToMesh(hotspotMesh);
        gizmoManagerRef.current.gizmos.positionGizmo?.onDragEndObservable.add((event) => {
          const updatedHotspot = { ...selectedHotspot, position: hotspotMesh.position.clone() };
          updateHotspot(updatedHotspot);
        });
        gizmoManagerRef.current.gizmos.scaleGizmo?.onDragEndObservable.add((event) => {
          const updatedHotspot = { ...selectedHotspot, scale: hotspotMesh.scaling.clone() };
          updateHotspot(updatedHotspot);
        });
      }
    } else if (gizmoManagerRef.current) {
      gizmoManagerRef.current.attachToMesh(null);
    }
  }, [selectedHotspot, scene]);

  const renderHotspots = () => {
    scene.meshes.forEach(mesh => {
      if (mesh.name.startsWith('hotspot-')) {
        mesh.dispose();
      }
    });

    hotspots.forEach(hotspot => {
      const sphere = BABYLON.MeshBuilder.CreateSphere(`hotspot-${hotspot.id}`, { diameter: 0.2 }, scene);
      sphere.position = hotspot.position;
      sphere.scaling = hotspot.scale;
      
      const material = new BABYLON.StandardMaterial(`hotspot-material-${hotspot.id}`, scene);
      material.diffuseColor = BABYLON.Color3.FromHexString(hotspot.color);
      material.emissiveColor = BABYLON.Color3.FromHexString(hotspot.color).scale(0.5);
      sphere.material = material;

      sphere.actionManager = new BABYLON.ActionManager(scene);
      sphere.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          () => {
            material.emissiveColor = BABYLON.Color3.FromHexString(hotspot.color);
            if (hotspot.activationMode === 'hover') {
              setDisplayedHotspot(hotspot);
            }
          }
        )
      );
      sphere.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          () => {
            material.emissiveColor = BABYLON.Color3.FromHexString(hotspot.color).scale(0.5);
            if (hotspot.activationMode === 'hover') {
              setDisplayedHotspot(null);
            }
          }
        )
      );
      sphere.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            if (hotspot.activationMode === 'click') {
              setDisplayedHotspot(hotspot);
            }
          }
        )
      );
    });
  };



  const addHotspot = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsAddingHotspot(true);
    setIsCollapsed(false);
  };

  const handleCanvasClick = (event: MouseEvent) => {
    if (!isAddingHotspot || !canvasRef.current) return;

    const pickResult = scene.pick(scene.pointerX, scene.pointerY);
    if (pickResult.hit) {
      const newHotspot: Hotspot = {
        id: `hotspot-${Date.now()}`,
        position: pickResult.pickedPoint!,
        scale: new BABYLON.Vector3(1, 1, 1),
        title: `Hotspot ${hotspots.length + 1}`,
        activationMode: 'click',
        color: '#ff0000',
      };
      setHotspots([...hotspots, newHotspot]);
      setIsAddingHotspot(false);
      setSelectedHotspot(newHotspot);
    }
  };

  useEffect(() => {
    if (isAddingHotspot && canvasRef.current) {
      canvasRef.current.addEventListener('click', handleCanvasClick);
    }
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [isAddingHotspot]);

  const updateHotspot = (updatedHotspot: Hotspot) => {
    setHotspots(hotspots.map(h => h.id === updatedHotspot.id ? updatedHotspot : h));
    setSelectedHotspot(updatedHotspot);
  };

  const deleteHotspot = (id: string) => {
    setHotspots(hotspots.filter(h => h.id !== id));
    setSelectedHotspot(null);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setSelectedHotspot(null);
    }
  };

  React.useImperativeHandle(ref, () => ({
    renderHotspots,
  }));
  return (
    <>
      <Draggable handle=".handle">
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '350px',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          zIndex: 1000,
          maxWidth: isCollapsed ? '180px' : '320px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          transition: 'max-width 0.3s ease-in-out',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        }}>
          <div className="handle" style={{ cursor: 'move', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.1)', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '5px' }}>
            <span>Hotspot Manager</span>
            <button onClick={toggleCollapse} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>
              {isCollapsed ? '▼' : '▲'}
            </button>
          </div>
          {!isCollapsed && (
            <>
              <button onClick={addHotspot} disabled={isAddingHotspot} style={{ width: '100%', padding: '10px', marginBottom: '15px', backgroundColor: '#4CAF50', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '5px' }}>
                {isAddingHotspot ? 'Click in the scene to place hotspot' : 'Add Hotspot'}
              </button>
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ marginBottom: '10px' }}>Hotspot List</h3>
                {hotspots.map((hotspot) => (
                  <div key={hotspot.id} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '8px', borderRadius: '5px' }}>
                    <span>{hotspot.title}</span>
                    <button onClick={() => setSelectedHotspot(hotspot)} style={{ padding: '5px 10px', backgroundColor: '#008CBA', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }}>Edit</button>
                  </div>
                ))}
              </div>
              {selectedHotspot && (
                <div style={{ marginTop: '15px', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '15px', borderRadius: '5px' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>Edit Hotspot</h3>
                  <input
                    type="text"
                    value={selectedHotspot.title}
                    onChange={(e) => updateHotspot({ ...selectedHotspot, title: e.target.value })}
                    placeholder="Title"
                    style={{ width: '100%', marginBottom: '10px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', border: 'none', borderRadius: '3px' }}
                  />
                  <textarea
                    value={selectedHotspot.information || ''}
                    onChange={(e) => updateHotspot({ ...selectedHotspot, information: e.target.value })}
                    placeholder="Information"
                    style={{ width: '100%', marginBottom: '10px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', border: 'none', borderRadius: '3px', minHeight: '100px' }}
                  />
                  <input
                    type="text"
                    value={selectedHotspot.photoUrl || ''}
                    onChange={(e) => updateHotspot({ ...selectedHotspot, photoUrl: e.target.value })}
                    placeholder="Photo URL"
                    style={{ width: '100%', marginBottom: '10px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', border: 'none', borderRadius: '3px' }}
                  />
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'white' }}>Activation Mode:</label>
                    <select
                      value={selectedHotspot.activationMode}
                      onChange={(e) => updateHotspot({ ...selectedHotspot, activationMode: e.target.value as 'click' | 'hover' })}
                      style={{ width: '100%', padding: '5px', backgroundColor: 'white', color: 'black', border: 'none', borderRadius: '3px' }}
                    >
                      <option value="click">Click</option>
                      <option value="hover">Hover</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'white' }}>Color:</label>
                    <input
                      type="color"
                      value={selectedHotspot.color}
                      onChange={(e) => updateHotspot({ ...selectedHotspot, color: e.target.value })}
                      style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '3px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={() => deleteHotspot(selectedHotspot.id)} style={{ width: '48%', padding: '8px', backgroundColor: '#f44336', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }}>
                      Delete
                    </button>
                    <button onClick={() => setSelectedHotspot(null)} style={{ width: '48%', padding: '8px', backgroundColor: '#555', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Draggable>
      {displayedHotspot && (
        <HotspotContentDisplay
          hotspot={displayedHotspot}
          onClose={() => setDisplayedHotspot(null)}
          showCloseButton={displayedHotspot.activationMode === 'click'}
          mousePosition={{ x: scene.pointerX, y: scene.pointerY }}
        />
      )}
    </>
  );
});

export default HotspotManager;