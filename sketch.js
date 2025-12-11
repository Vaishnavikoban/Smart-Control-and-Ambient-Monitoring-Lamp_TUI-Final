// -------------------------------------------------------
// SMART RGB LAMP UI — Fully Responsive Neo-Glow + Glassmorphism Hybrid
// -------------------------------------------------------

let port;
let writer;
let reader;
let temperature = "--";

let mode = "auto";
let selectedColor = "#FF0000";
let effect = "static";
let colorInput;

let scaleFactor = 1;

// -------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  updateScale();

  // Centered Connect Button
  let connectBtn = createButton("Connect to Arduino");
  connectBtn.position(width / 2 - 80, 30);
  connectBtn.style("padding", "12px 26px");
  connectBtn.style("font-size", "16px");
  connectBtn.style("border", "none");
  connectBtn.style("cursor", "pointer");
  connectBtn.style("border-radius", "10px");
  connectBtn.style(
    "background",
    "linear-gradient(135deg, #3a86ff, #8338ec)"
  );
  connectBtn.style("color", "white");
  connectBtn.style("box-shadow", "0 0 12px rgba(138, 43, 226, 0.6)");
  connectBtn.mousePressed(connectPort);
}

// -------------------------------------------------------
async function connectPort() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();
    reader = port.readable.getReader();
    readSerialLoop();
    console.log("Serial Connected!");
  } catch (err) {
    console.log("Serial Connection Failed", err);
  }
}

// -------------------------------------------------------
async function readSerialLoop() {
  while (port.readable) {
    try {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        let text = new TextDecoder().decode(value);
        if (text.includes("TEMP:")) {
          let t = text.split("TEMP:")[1].trim();
          if (!isNaN(parseFloat(t))) temperature = t;
        }
      }
    } catch (err) {
      console.error("Read error", err);
      break;
    }
  }
}

// -------------------------------------------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateScale();
  if (colorInput) updateColorPickerPosition();
}

// -------------------------------------------------------
function updateScale() {
  // Adjust scaling based on screen width
  if (windowWidth < 500) scaleFactor = 0.65;
  else if (windowWidth < 800) scaleFactor = 0.8;
  else scaleFactor = 1;
}

// -------------------------------------------------------
function draw() {
  drawBackground();
  drawUI();
}

// -------------------------------------------------------
function drawBackground() {
  let c1 = color("#0D0D0D");
  let c2 = color("#1a1a40");

  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }

  noStroke();
  fill(255, 50, 150, 30);
  ellipse(width * 0.25, height * 0.3, 300, 300);

  fill(80, 120, 255, 25);
  ellipse(width * 0.75, height * 0.7, 350, 350);
}

// -------------------------------------------------------
function drawUI() {
  push();
  translate(width / 2, 0);
  scale(scaleFactor);

  fill(255, 255, 255, 18);
  stroke(255, 255, 255, 30);
  rect(-260, 120, 520, 700, 25); // taller for dynamic spacing

  fill(255);
  noStroke();
  textAlign(CENTER);
  textSize(32 * scaleFactor);
  text("Smart RGB Lamp Control", 0, 170 * scaleFactor);

  drawTemperatureBox();
  drawModeButtons();

  updateColorPickerVisibility();

  if (mode === "manual") {
    drawColorPicker();
    drawEffectButtons();
  }

  pop();
}

// -------------------------------------------------------
function drawTemperatureBox() {
  push();
  fill(255, 255, 255, 30);
  stroke(255, 255, 255, 40);
  rect(-130, 200, 260, 50, 14);

  noStroke();
  fill(255);
  textSize(20 * scaleFactor);
  text(`🌡 Temperature: ${temperature}°C`, 0, 232);
  pop();
}

// -------------------------------------------------------
function drawModeButtons() {
  drawButton(-130, 270, 120, 50, "AUTO", mode === "auto");
  drawButton(10, 270, 120, 50, "MANUAL", mode === "manual");
}

function drawButton(x, y, w, h, label, active) {
  push();
  drawingContext.shadowBlur = active ? 18 : 0;
  drawingContext.shadowColor = active ? "rgba(255,0,120,0.7)" : "transparent";

  fill(active ? "rgba(255,0,120,0.45)" : "rgba(255,255,255,0.15)");
  rect(x, y, w, h, 15);
  pop();

  fill(255);
  textSize(18 * scaleFactor);
  text(label, x + w / 2, y + h / 1.5);
}

// -------------------------------------------------------
function updateColorPickerVisibility() {
  if (colorInput) {
    if (mode === "manual") colorInput.show();
    else colorInput.hide();
  }
}

function updateColorPickerPosition() {
  // Dynamic position below text
  let textY = 350 * scaleFactor;
  let pickerY = textY + 20 * scaleFactor;
  colorInput.position(width / 2 - 55 * scaleFactor, pickerY);
  colorInput.size(120 * scaleFactor);
}

// -------------------------------------------------------
function drawColorPicker() {
  let textY = 355 * scaleFactor;
  fill(255);
  textSize(20 * scaleFactor);
  text("Choose LED Color", 0, textY);

  if (!colorInput) {
    colorInput = createColorPicker("#ff0000");
    updateColorPickerPosition();
    colorInput.input(sendManualColor);
  } else {
    updateColorPickerPosition();
  }
}

function sendManualColor() {
  selectedColor = this.value();

  let r = unhex(selectedColor.substring(1, 3));
  let g = unhex(selectedColor.substring(3, 5));
  let b = unhex(selectedColor.substring(5, 7));

  sendToArduino(`RGB:${r},${g},${b}\n`);
  sendToArduino(`EFFECT:${effect.toUpperCase()}\n`);
}

// -------------------------------------------------------
function drawEffectButtons() {
  let startY = 440 * scaleFactor;
  let btnY = startY + 30 * scaleFactor;

  fill(255);
  textSize(20 * scaleFactor);
  text("Lighting Effects", 0, startY);

  drawEffectButton(-180, btnY, "Static", "static");
  drawEffectButton(-60, btnY, "Breathing", "breathing");
  drawEffectButton(60, btnY, "Heartbeat", "heartbeat");
  drawEffectButton(180, btnY, "Strobe", "strobe");
}

function drawEffectButton(x, y, label, value) {
  let active = (effect === value);

  push();
  drawingContext.shadowBlur = active ? 20 : 0;
  drawingContext.shadowColor = active ? "rgba(60,150,255,0.8)" : "transparent";

  fill(active ? "rgba(60,150,255,0.35)" : "rgba(255,255,255,0.15)");
  rect(x - 50, y, 100, 45, 12);
  pop();

  fill(255);
  textSize(16 * scaleFactor);
  textAlign(CENTER, CENTER);
  text(label, x, y + 23);
}

// -------------------------------------------------------
function mousePressed() {
  let mx = (mouseX - width / 2) / scaleFactor;
  let my = mouseY / scaleFactor;

  // AUTO MODE
  if (inside(mx, my, -130, 270, 120, 50)) {
    mode = "auto";
    sendToArduino("AUTO\n");
    updateColorPickerVisibility();
  }

  // MANUAL MODE
  if (inside(mx, my, 10, 270, 120, 50)) {
    mode = "manual";
    sendToArduino("MANUAL\n");
    updateColorPickerVisibility();
  }

  if (mode === "manual") {
    // FIXED HITBOX VALUES
    let startY = 440 * scaleFactor;
    let btnY = startY + 30 * scaleFactor;

    if (inside(mx, my, -180, btnY, 100, 45)) sendEffect("STATIC");
    if (inside(mx, my, -60,  btnY, 100, 45)) sendEffect("BREATH");
    if (inside(mx, my, 60,   btnY, 100, 45)) sendEffect("HEART");
    if (inside(mx, my, 180,  btnY, 100, 45)) sendEffect("STROBE");
  }
}

function inside(mx, my, x, y, w, h) {
  return mx > x && mx < x + w && my > y && my < y + h;
}

function sendEffect(name) {
  if (name === "BREATH") effect = "breathing";
  else if (name === "HEART") effect = "heartbeat";
  else effect = name.toLowerCase();

  sendToArduino(`EFFECT:${name}\n`);
}

// -------------------------------------------------------
function sendToArduino(msg) {
  if (writer) {
    writer.write(new TextEncoder().encode(msg));
  }
}
