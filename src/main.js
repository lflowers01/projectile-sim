import { isJSDocThisTag } from 'typescript';
import './style.css';
import p5 from 'p5';

const grav = 9.81;
const scale = 15;
let heightSlider, massSlider; // Remove velocitySlider
let clearButton; // Declare the clear button
let heightValue, massValue; // Declare elements to display slider values

const sketch = (p) => {

  class Ray {
    constructor(x, y, vx, vy, color) {
      this.x = x;
      this.y = y; 
      this.vx = vx;
      this.vy = vy;
      this.color = color;
    }
  
    update() {
      p.push();
      p.stroke(this.color); // Set the color of the vector
      p.strokeWeight(2); // Set the thickness of the line
      p.line(this.x, this.y, this.x + this.vx, this.y + this.vy); // Draw the vector as a line
      p.pop();
    }
  }
  class Aimer {
    constructor(x, y, angle, force) {
      this.x = x;
      this.y = y;
      this.angle = angle;
      this.force = force; // Use force instead of velocity
      this.ray = new Ray(this.x, this.y, Math.cos(this.angle) * this.force, Math.sin(this.angle) * this.force, "yellow");
      this.dragging = false; // Flag to track if the circle is being dragged
      this.dragX = this.x + Math.cos(this.angle) * this.force * 10; // Initial draggable circle x
      this.dragY = this.y + Math.sin(this.angle) * this.force * 10; // Initial draggable circle y
      this.old_angle = this.angle;
    }
  
    update(cannon) {
      // Set the Aimer's position to the tip of the cannon
      this.x = cannon.x + Math.cos(this.angle);
      this.y = cannon.y + 10 + Math.sin(this.angle);
  
      if (!this.dragging) {
        // Update the draggable circle position based on angle and force
        this.dragX = this.x + Math.cos(this.angle) * this.force * scale;
        this.dragY = this.y + Math.sin(this.angle) * this.force * scale;
      } else {
        // Update angle and force based on the draggable circle's position
        this.angle = Math.atan2(this.dragY - this.y, this.dragX - this.x);
        this.force = p.dist(this.x, this.y, this.dragX, this.dragY) / scale; // Scale force
      }

      if (this.angle * (180 / -Math.PI) > 90) {
        this.angle = 90 * (-Math.PI / 180); // Cap at 90 degrees
      } else if (this.angle * (180 / -Math.PI) < -90) {
        this.angle = -90 * (-Math.PI / 180); // Cap at -90 degrees
      } else {
        this.old_angle = this.angle;
      }
      
      if (this.dragX < 0) this.dragX = 0; // Prevent dragging off the left edge
      if (this.dragX > p.width) this.dragX = p.width; // Prevent dragging off the right edge
      if (this.dragY < 0) this.dragY = 0; // Prevent dragging off the top edge
      if (this.dragY > p.height) this.dragY = p.height; // Prevent dragging off the bottom edge
  
      // Update the ray's velocity components
      this.ray.vx = Math.cos(this.angle) * this.force * scale;
      this.ray.vy = Math.sin(this.angle) * this.force * scale;
      this.ray.x = this.x;
      this.ray.y = this.y;
  
      // Draw the ray
      this.ray.update();
  
      // Draw the draggable circle
      p.fill(255); // White color
      p.stroke(0); // Black border
      p.strokeWeight(1); // Ensure consistent outline thickness
      p.ellipse(this.dragX, this.dragY, 10); // Draw the draggable circle
    }
  
    isMouseOver() {
      // Check if the mouse is over the draggable circle
      return p.dist(p.mouseX, p.mouseY, this.dragX, this.dragY) < 10;
    }
  }
  class Projectile {
    constructor(x, y, angle, force, radius) {
      this.x = x;
      this.y = y;
      this.startX = x; // Store the starting x position
      this.initialVel = (force / radius) * 10;
      this.initialForce = force; 
      this.x_velocity = Math.cos(angle) * this.initialVel; // Initial x velocity based on force
      this.y_velocity = Math.sin(angle) * -this.initialVel; // Initial y velocity based on force
      this.radius = radius;
      // Store initial force
      this.initialAngle = angle; // Store initial angle
      this.mass = radius; // Store mass (radius is proportional to mass)
      this.trajectory = []; // Store trajectory points
      p.colorMode(p.HSB, 360, 100, 100); // Set color mode to HSB for saturation control
      this.color = p.color(p.random(360), 100, 100); // Randomize color with 100% saturation
      p.colorMode(p.RGB, 255, 255, 255);

      // Create rays for x and y velocity components
      this.x_component = new Ray(this.x, this.y, this.x_velocity / scale, 0, 'green'); // X-component ray
      this.y_component = new Ray(this.x, this.y, 0, -this.y_velocity / scale, 'blue'); // Y-component ray

      this.trajectory = []; // Store trajectory points
    }

    update() {
      // Normalize updates using deltaTime to prevent lag inaccuracies
      const timeStep = p.deltaTime / 1000; // Convert deltaTime to seconds

      // Update velocities and position
      this.y_velocity -= grav  * timeStep; // Apply gravity to the y velocity
      this.x += this.x_velocity * timeStep * 100; // Scale for consistent movement
      this.y -= this.y_velocity * timeStep * 100; // Scale for consistent movement

      // Check if the projectile hits the ground
      if (this.y + this.radius >= p.height) {
        this.y = p.height - this.radius; // Stop at the ground
        this.y_velocity = 0; // Stop vertical movement
        this.x_velocity = 0;
      }

      // Draw the projectile with its randomized color
      p.fill(this.color);
      p.noStroke();
      p.ellipse(this.x, this.y, this.radius * 2); // Draw the projectile as a circle

      // Update and draw the velocity component rays
      this.x_component.x = this.x;
      this.x_component.y = this.y;
      this.x_component.vx = this.x_velocity * 5; // Scale for visibility
      this.x_component.vy = 0;
      this.x_component.update();

      this.y_component.x = this.x;
      this.y_component.y = this.y;
      this.y_component.vx = 0;
      this.y_component.vy = -this.y_velocity * 5; // Scale for visibility
      this.y_component.update();

      // Add the current position to the trajectory
      this.trajectory.push({ x: this.x, y: this.y });

      // Draw the trajectory
      p.stroke(255); // Set stroke color to white
      p.strokeWeight(1); // Set line thickness
      for (let i = 1; i < this.trajectory.length; i++) {
        const prev = this.trajectory[i - 1];
        const curr = this.trajectory[i];
        p.line(prev.x, prev.y, curr.x, curr.y); // Draw a line between consecutive points
      }

      // Check if the mouse is hovering over the projectile
      if (p.dist(p.mouseX, p.mouseY, this.x, this.y) < this.radius) {
        const displacement = Math.abs(this.x - this.startX); // Calculate horizontal displacement
        p.fill(0); // Set text color to black
        p.textSize(12); // Set text size
        // Display displacement, initial force, angle, mass, and initial velocity
        p.text(
          `Δx: ${(displacement / 10).toFixed(2)} m\n` +
          `Initial Force: ${this.initialForce.toFixed(1)} N\n` +
          `Launch Angle: ${(this.initialAngle * (180 / -Math.PI)).toFixed(1)}°\n` +
          `Mass: ${this.mass.toFixed(1)} kg\n` +
          `Initial Velocity: ${this.initialVel.toFixed(1)} m/s`,
          this.x - 50,
          this.y - this.radius - 50
        );
      }
    }

    isOffScreen() {
      return this.x < 0 || this.x > p.width; // Only check if the projectile goes off the sides
    }
  }

  class Cannon {
    constructor(x, y, angle, launch) {
      this.x = x;
      this.y = y;
      this.angle = angle;
      this.launch = launch;
      
    }
 
    update() {
    
      p.push(); // Save the current transformation state
      p.translate(this.x, this.y + 10); // Move the origin to the cannon's base
      p.rotate(this.angle); // Rotate the cannon to the given angle
      p.fill(50); // Set the cannon color to a darker gray
      p.noStroke();
      p.rect(0, -10, 50, 20); // Draw the cannon as a rectangle
      p.pop(); // Restore the original transformation state
      aimer.update(this);
    }
  }

  

  let projectiles = [];
  let cannon = new Cannon(25, 500, 0, 0); // Create a new cannon instance
  let aimer = new Aimer(25,500, 0, 10);
  p.setup = () => {
    p.createCanvas(800, 600); // Create the canvas
    
    p.background(220); // Set the background color to light gray
    
    // Remove the velocity slider
    // velocitySlider = p.createSlider(1, 20, 10, 1); 
    // velocitySlider.position(10, 10); 
    // velocitySlider.style('width', '200px'); 
    // p.createDiv('Launch Velocity').position(220, 5); 

    // Create a slider for launch height
    heightSlider = p.createSlider(50, p.height - 15, (p.height - 15) * 0.75, 10); // Corrected slider range to ensure proper functionality
    heightSlider.position(10, 40); // Position the slider
    heightSlider.style('width', '200px'); // Set the slider width
    p.createDiv('Launch Height').position(220, 35); // Label for height slider

    // Create a slider for mass/radius
    massSlider = p.createSlider(5, 20, 10, 1); // Min: 5, Max: 50, Default: 10, Step: 1
    massSlider.position(10, 70); // Position the slider
    massSlider.style('width', '200px'); // Set the slider width
    p.createDiv('Mass').position(220, 65); // Label for mass/radius slider

    // Create a "Clear" button
    clearButton = p.createButton('Clear');
    clearButton.position(10, 100); // Position the button
    clearButton.mousePressed(() => {
      projectiles = []; // Clear the projectiles list
    });

    // Display height slider value
    heightValue = p.createDiv(`Height: ${heightSlider.value()/10} m`);
    heightValue.position(350, 35); // Position the height value display

    // Display mass slider value
    massValue = p.createDiv(`Mass: ${massSlider.value()} kg`);
    massValue.position(350, 65); // Position the mass value display
  };

  p.draw = () => {
    p.background(200); // Ensure the background is light gray each frame

    // Update slider value displays
    heightValue.html(`${(p.height - heightSlider.value()) / 10} m`);
    massValue.html(`${massSlider.value()} kg`);

    // Display velocity and launch angle in the top-right corner
    p.fill(0); // Set text color to black
    p.textSize(16); // Set text size
    p.text(`Force: ${aimer.force.toFixed(1)} N`, p.width - 200, 20);
    p.text(`Angle: ${(aimer.angle * (180 / -Math.PI)).toFixed(0)}°`, p.width - 200, 40);

    // Update cannon's height based on the height slider
    cannon.y = heightSlider.value();
    cannon.angle = aimer.angle

    // Draw projectiles
    for (let i = 0; i < projectiles.length; i++) {
      projectiles[i].update(); // Update each projectile
      if (projectiles[i].isOffScreen()) {
        projectiles.splice(i, 1); // Remove the projectile if it's off-screen
      }
    }

    // Update cannon angle to face the mouse
    
    cannon.update(); // Update the cannon
    
  };

  p.mousePressed = () => {
    // Prevent creating projectiles when clicking the clear button or sliders
    if (
      clearButton.elt.contains(document.elementFromPoint(p.mouseX, p.mouseY)) ||
      heightSlider.elt.contains(document.elementFromPoint(p.mouseX, p.mouseY)) ||
      massSlider.elt.contains(document.elementFromPoint(p.mouseX, p.mouseY))
    ) {
      return;
    }

    // Check if the mouse is over the draggable circle
    if (aimer.isMouseOver()) {
      aimer.dragging = true; // Start dragging the circle
    } else {
      // Get velocity from the aimer's calculated velocity
      const force = aimer.force;
      const radius = massSlider.value();

      // Limit the projectiles list to a maximum of 15
      if (projectiles.length >= 15) {
        projectiles.shift(); // Remove the oldest projectile
      }

      // Create a new projectile with the slider values
      projectiles.push(new Projectile(aimer.x, aimer.y, aimer.angle, force, radius));
    }
  };

  p.mouseDragged = () => {
    if (aimer.dragging) {
      // Update the draggable circle's position while dragging
      console.log(aimer.dragX, aimer.dragY, p.mouseX, p.mouseY);
      aimer.dragX = p.mouseX;
      aimer.dragY = p.mouseY;
      
    }
  };

  p.mouseReleased = () => {
    aimer.dragging = false; // Stop dragging the circle
    
  };
};

// Create a new p5 instance
new p5(sketch);