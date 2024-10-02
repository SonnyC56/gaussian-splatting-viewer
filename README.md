# Gaussian Splatting Viewer with HTML Export

**Gaussian Splatting Viewer with HTML Export** is an interactive 3D visualization tool built with React and Babylon.js. It allows users to load, manipulate, and explore 3D models seamlessly through an intuitive user interface. Additionally, it provides robust HTML export functionality, enabling users to generate standalone HTML files of their customized 3D scenes for easy sharing and deployment.

## Table of Contents
- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

### 3D Model Loading
- **Drag-and-Drop**: Easily load `.splat`, `.ply`, `.gltf`, or `.glb` files by dragging them into the application.
- **URL Loading**: Load models from predefined URLs or provide custom URLs for dynamic model loading.

### Waypoint Management
- **Edit Waypoints**: Adjust the camera's path by editing X, Y, Z coordinates of waypoints.
- **Add/Remove Waypoints**: Dynamically add new waypoints based on the current camera position or remove existing ones.

### Camera Controls
- **Interactive Movement**: Navigate through the 3D scene using W/A/S/D keys, mouse movements, and gamepad support.
- **Scroll Navigation**: Use scroll controls or buttons to move the camera along the predefined path.
- **Customization**: Adjust camera movement speed and rotation sensitivity to suit your preferences.

### User Interface
- **Draggable UI Panels**: All control panels are draggable, allowing users to position them as desired.
- **Parameter Adjustments**: Modify scroll speed, animation frames, camera speed, and rotation sensitivity in real-time.
- **Background Customization**: Change the scene's background color using a color picker.

### Export Functionality
- **Standalone HTML Export**: Export the current scene configuration, including camera path and loaded models, to a standalone HTML file for easy sharing and deployment.

### Interactive Elements
- **Hover Interactions**: Interactive hotspots with tooltips enhance the user experience.
- **WebXR Support**: If supported by the browser, experience the scene in immersive VR.

## Demo
Currently, there is no live demo available. Please follow the [Installation](#installation) section to set up the application locally and explore its features.

## Installation

Follow these steps to set up and run the Gaussian Splatting Viewer locally.

### Prerequisites
- **Node.js**: Ensure you have Node.js installed. You can download it from [here](https://nodejs.org/).
- **npm**: Package manager for installing dependencies.

### Steps
1. **Clone the Repository**:
    ```bash
    git clone https://github.com/SonnyC56/gaussian-splatting-viewer.git
    cd gaussian-splatting-viewer
    ```
2. **Install Dependencies**:
    Using npm:
    ```bash
    npm install
    ```
3. **Run the Application**:
    Using npm:
    ```bash
    npm start
    ```
4. **Access the App**:  
    Open your browser and navigate to `http://localhost:3000` to view the application.

## Usage

Explore the various features of Gaussian Splatting Viewer through its user-friendly interface.

### Loading 3D Models
- **Drag-and-Drop**: Drag a `.splat`, `.ply`, `.gltf`, or `.glb` file onto the application window to load the model.
- **URL Loading**: Use the predefined buttons to load sample models.  
  Enter a custom model URL in the input field and click "Load Custom Splat" to load models from external sources.

### Managing Waypoints
- **Edit Coordinates**: Navigate to the "Edit Waypoints" panel. Adjust the X, Y, Z values for each waypoint to redefine the camera path.
- **Add Waypoints**: Click "Add Waypoint at Current Position" to append a new waypoint based on the camera's current location.
- **Remove Waypoints**: Click the "Delete" button next to a waypoint to remove it from the path.

### Adjusting Parameters
- **Scroll Speed**: Modify how quickly the camera moves along the path during scroll interactions.
- **Animation Frames**: Set the number of frames for smooth camera animations.
- **Camera Speed**: Adjust the movement speed of the camera using W/A/S/D keys.
- **Camera Rotation Sensitivity**: Change how responsive the camera rotation is to mouse movements.

### Background Customization
Use the color picker in the "Background Color" panel to change the scene's background to your preferred color.

### Exporting the Scene
Click the "Export Scene" button to generate a standalone HTML file of your current setup.  
Specify if you want to include the UI controls in the exported file.  
Download and share your customized 3D scene effortlessly.

### Interactive Controls Info
Access the "Controls" panel to view a summary of all available controls and interactions within the application.

## Project Structure
```bash
gaussian-splatting-viewer/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── components/
│   │   └── App.tsx
│   ├── assets/
│   ├── styles/
│   │   └── App.css
│   ├── index.tsx
│   └── ...
├── package.json
├── tsconfig.json
├── README.md
└── ...
