
// const: fixed reference to an HTML element (canvas)
// document: built-in object that represents the entire web page currently loaded in the browser
// <canvas id="archiveCanvas"></canvas>
const canvas = document.getElementById('archiveCanvas');

// ctx: A custom variable name (short for "context") chosen by the developer to hold the drawing object
// .getContext: A method called on the canvas element that returns a CanvasRenderingContext2D object
const ctx = canvas.getContext('2d');

// stretches canvas so that it matches the width and height of the user's browser window
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/*
• window: The built-in JavaScript object representing the user's browser window.
• .addEventListener(...): A method that tells the browser to wait and listen for a specific event to happen on that object.
• 'resize': The first argument. It specifies the type of event to listen for. In this case, it fires whenever the user drags the corner of the browser window, maximizes it, or changes phone orientation.
• resize: The second argument. This is the name of your custom function (from the previous step). It tells the browser: "When the 'resize' event happens, run my resize() function."
*/
window.addEventListener('resize', resize);
resize();

/*
• class Vector3: Declares a new JavaScript class named Vector3. Think of a class as a cookie cutter or a blueprint. It doesn't create data itself; it defines the structure for data you will create later.
• constructor(x, y, z): A special initialization function that runs automatically only once—right when you create a new instance of the class. It accepts three inputs (parameters): x, y, and z.
• this: A keyword that refers to the specific, individual object currently being built by the constructor.
• this.x = x; (and this.y, this.z): Takes the incoming values passed into t
*/
class Vector3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

// 1. GLOBAL ENGINE SYSTEM STATE VARIABLES
/*
• let: A JavaScript keyword used to declare variables that can be updated or changed later in your code. (Unlike const, which blocks changes).
• targetRotationX and targetRotationY: These track where the object wants to go. For example, if you move your mouse to the far right, your script might immediately set targetRotationY = 1.5 radians.
• currentRotationX and currentRotationY: These track where the object actually is right now on the screen.
• = 0;: This initializes all four variables with a starting value of 0 (meaning no rotation at all when the page first loads).
*/
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

// Upgraded zoom scalars to keep the flipped frog close and highly visible right on load
let targetZoom = 1000;
let currentZoom = 1000;

/*
• let isDragging = false;: A Boolean flag (true/false switch) that tracks whether the user is currently holding down their mouse button to drag something.
  • It starts as false because the user isn't clicking yet.
  • You will set it to true on a mousedown event, and back to false on a mouseup event.
• let previousMouseX = 0; and previousMouseY = 0;: These store the exact screen coordinates of the mouse from the very last frame or event.
  • By subtracting these from the current mouse coordinates, you can calculate exactly how many pixels the user's mouse moved since the last frame (the delta distance).
• let selectedNodeIndex = null;: Stored as null (which means empty or nothing), this variable will hold a number representing which specific item or point (node) the user is clicking on.
  • For example, if you have an array of shapes and the user clicks the 3rd one, this will change to 2 (since arrays start counting at 0). If they aren't clicking any object, it resets to null.
*/
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let selectedNodeIndex = null;

// 2. PERSPECTIVE PROJECTION MATRIX
function project(vector3D) {
  const cameraDepth = 400;
  const scale = currentZoom / (vector3D.z + cameraDepth);
  const x2D = (vector3D.x * scale) + (canvas.width / 2);
  const y2D = (vector3D.y * scale) + (canvas.height / 2);
  return { x: x2D, y: y2D, scale: scale };
}

// 3. MATRIX ROTATION MULTIPLICATION (R^3 -> R^3)
function rotatePoint(point, angleX, angleY) {
  const cosX = Math.cos(angleX);
  const sinX = Math.sin(angleX);
  const cosY = Math.cos(angleY);
  const sinY = Math.sin(angleY);

  let x1 = point.x;
  let y1 = point.y * cosX - point.z * sinX;
  let z1 = point.y * sinX + point.z * cosX;

  let x2 = x1 * cosY + z1 * sinY;
  let y2 = y1;
  let z2 = -x1 * sinY + z1 * cosY;

  return new Vector3(x2, y2, z2);
}

// 4. INTERACTION LISTENERS (MOUSE AND SCROLL WHEEL)
window.addEventListener('wheel', (event) => {
  targetZoom -= event.deltaY * 0.4;
  targetZoom = Math.min(Math.max(targetZoom, 50), 1000);
});

window.addEventListener('mousedown', (event) => {
  isDragging = true;
  previousMouseX = event.clientX;
  previousMouseY = event.clientY;
});

window.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const deltaX = event.clientX - previousMouseX;
    const deltaY = event.clientY - previousMouseY;

    targetRotationY += deltaX * 0.005;
    targetRotationX += deltaY * 0.005;

    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
  }
});

window.addEventListener('mouseup', (event) => {
  isDragging = false;
  handleSelection(event.clientX, event.clientY);
});

// RAYCAST ELEMENT FILTER MATRIX
function handleSelection(screenX, screenY) {
  let closestNodeIndex = null;
  let closestDistance = Infinity;

  nodes.forEach((item, index) => {
    let centerShiftX = selectedNodeIndex !== null ? nodes[selectedNodeIndex].position.x : 0;
    let centerShiftY = selectedNodeIndex !== null ? nodes[selectedNodeIndex].position.y : 0;
    let centerShiftZ = selectedNodeIndex !== null ? nodes[selectedNodeIndex].position.z : 0;

    const alignedPos = new Vector3(item.position.x - centerShiftX, item.position.y - centerShiftY, item.position.z - centerShiftZ);
    const rotPos = rotatePoint(alignedPos, currentRotationX, currentRotationY);
    const projected = project(rotPos);

    if (projected.scale > 0) {
      const dx = screenX - projected.x;
      const dy = screenY - projected.y;
      const distance2D = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = item.radius * projected.scale * 3.5;

      if (distance2D <= hitRadius && distance2D < closestDistance) {
        closestDistance = distance2D;
        closestNodeIndex = index;
      }
    }
  });

  if (closestNodeIndex !== null) {
    selectedNodeIndex = closestNodeIndex;
    targetZoom = 1000; // Focused deep immersion scale
  } else {
    selectedNodeIndex = null;
    targetZoom = 1000; // Smooth recovery back to larger default startup box view
  }
}

// 5. ARCHIVE COMPONENT ENTITY CONSTRUCTOR
class ArchiveNode3D {
  constructor() {
    this.position = new Vector3(0, 0, 0);
    this.baseVelocity = new Vector3(
      (Math.random() - 0.5) * 0.08,
      (Math.random() - 0.5) * 0.08,
      (Math.random() - 0.5) * 0.08
    );
    this.radius = 4;
    this.tick = Math.random() * 100;
  }

  update() {
    this.tick += 0.02;
    const pulseFactor = (selectedNodeIndex !== null) ? 0.1 : 1.0;

    this.position.x += Math.sin(this.tick) * this.baseVelocity.x * pulseFactor;
    this.position.y += Math.cos(this.tick) * this.baseVelocity.y * pulseFactor;
    this.position.z += Math.sin(this.tick + 1) * this.baseVelocity.z * pulseFactor;
  }
}

// =========================================================================
// 5. FIXED DRAWING RATIO FROG GEOMETRIC COORDINATE MATRIX
// =========================================================================
const nodes = [];

function addPoint(x, y, z) {
  let node = new ArchiveNode3D();
  node.position = new Vector3(x, y, z);
  nodes.push(node);
}

// --- TWO CENTRAL NOSTRILS ---
addPoint(4, -52, 50);
addPoint(-4, -52, 50);

// --- MASSIVE WIDE CARTOON SMILE ---
addPoint(0, -32, 55);
addPoint(15, -34, 52);
addPoint(-15, -34, 52);
addPoint(32, -40, 45);
addPoint(-32, -40, 45);
addPoint(48, -50, 30);
addPoint(-48, -50, 30);
addPoint(40, -25, 40);
addPoint(-40, -25, 40);

// --- HUGE CIRCULAR CARTOON EYES ---
// Left Eye Outline (Flipped)
addPoint(24, -72, 40);
addPoint(36, -82, 30);
addPoint(24, -94, 30);
addPoint(12, -82, 35);
addPoint(24, -83, 44);
addPoint(25, -84, 38);

// Right Eye Outline (Flipped)
addPoint(-24, -72, 40);
addPoint(-36, -82, 30);
addPoint(-24, -94, 30);
addPoint(-12, -82, 35);
addPoint(-24, -83, 44);
addPoint(-25, -84, 38);

// --- CHUBBY HEAD-TO-BODY OUTLINE BARREL ---
addPoint(0, -10, 45);
addPoint(36, -20, 20);
addPoint(-36, -20, 20);
addPoint(45, 5, 15);
addPoint(-45, 5, 15);
addPoint(35, 30, 20);
addPoint(-35, 30, 20);
addPoint(0, 35, 25);

// --- CHUBBY FRONT ARMS ---
// Left Center Arm (Flipped)
addPoint(14, -12, 35);
addPoint(16, 10, 38);
addPoint(18, 32, 40);
addPoint(26, 40, 42);
addPoint(16, 42, 45);
addPoint(8, 40, 42);

// Right Center Arm (Flipped)
addPoint(-14, -12, 35);
addPoint(-16, 10, 38);
addPoint(-18, 32, 40);
addPoint(-8, 40, 42);
addPoint(-16, 42, 45);
addPoint(-26, 40, 42);

// --- SIDE-FLANKING BACK LEGS & SPLATED REAR FEET ---
// Left Rear Leg Profile (Flipped)
addPoint(48, 12, 10);
addPoint(60, 26, 5);
addPoint(50, 36, -5);
addPoint(68, 42, -10);
addPoint(56, 44, -5);
addPoint(44, 40, 5);

// Right Rear Leg Profile (Flipped)
addPoint(-48, 12, 10);
addPoint(-60, 26, 5);
addPoint(-50, 36, -5);
addPoint(-44, 40, 5);
addPoint(-56, 44, -5);
addPoint(-68, 42, -10);

// 6. MAIN MULTI-LAYER RENDERING LOOPS
function renderScene() {
  const maxDistance = 65;

  currentRotationX += (targetRotationX - currentRotationX) * 0.08;
  currentRotationY += (targetRotationY - currentRotationY) * 0.08;
  currentZoom += (targetZoom - currentZoom) * 0.08;

  let centerShiftX = 0, centerShiftY = 0, centerShiftZ = 0;
  if (selectedNodeIndex !== null) {
    const targetNode = nodes[selectedNodeIndex];
    centerShiftX = targetNode.position.x;
    centerShiftY = targetNode.position.y;
    centerShiftZ = targetNode.position.z;
  }

  // Process Proximity Relations Matrix lines
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      const dx = nodeA.position.x - nodeB.position.x;
      const dy = nodeA.position.y - nodeB.position.y;
      const dz = nodeA.position.z - nodeB.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < maxDistance) {
        const alignedA = new Vector3(nodeA.position.x - centerShiftX, nodeA.position.y - centerShiftY, nodeA.position.z - centerShiftZ);
        const alignedB = new Vector3(nodeB.position.x - centerShiftX, nodeB.position.y - centerShiftY, nodeB.position.z - centerShiftZ);

        const rotA = rotatePoint(alignedA, currentRotationX, currentRotationY);
        const rotB = rotatePoint(alignedB, currentRotationX, currentRotationY);

        const projA = project(rotA);
        const projB = project(rotB);

        if (projA.scale > 0 && projB.scale > 0) {
          const opacity = (1 - (distance / maxDistance)) * 0.35;
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 0.6 * projA.scale;

          ctx.beginPath();
          ctx.moveTo(projA.x, projA.y);
          ctx.lineTo(projB.x, projB.y);
          ctx.stroke();
        }
      }
    }
  }

  // Process Coordinate Element dots layer
  nodes.forEach((item, index) => {
    item.update();

    const alignedPos = new Vector3(item.position.x - centerShiftX, item.position.y - centerShiftY, item.position.z - centerShiftZ);
    const rotPos = rotatePoint(alignedPos, currentRotationX, currentRotationY);
    const projected = project(rotPos);

    if (projected.scale < 0) return;

    ctx.beginPath();
    ctx.arc(projected.x, projected.y, item.radius * projected.scale, 0, Math.PI * 2);

    if (index === selectedNodeIndex) {
      ctx.fillStyle = '#00ff00';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ff00';
    } else {
      const brightness = Math.min(Math.max(parseInt(projected.scale * 160), 30), 255);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.shadowBlur = 0;
    }

    ctx.fill();
  });
  ctx.shadowBlur = 0;
}
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderScene();
  requestAnimationFrame(animate);
}
animate();