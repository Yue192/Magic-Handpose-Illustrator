/* references for functions of star shapes and polygons:
 https://archive.p5js.org/examples/form-star.html
 https://archive.p5js.org/examples/form-regular-polygon.html*/
let video;
let handPose;
let hands = [];
let particles = [];
let stars = [];
let magics = [];
let rightHand = {};
let leftHand = {};
let rightHandPrevious = {
  thumb: null, index: null, middle: null, ring: null, pinky:null
};
let rightHandDistances = {};
let rightHandDistancesP = {};
let stillCount = 0;
let openCount = 0;
let starCooldown = 0;
let magicCooldown = 0;
let mode = 1;
let fistStartTime = null;
let clearTriggered = false;


// load hands information
function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function gotHands(results) {
  hands = results;
}

// setup video
function setup() {
  let canvas = createCanvas(640, 480);
  canvas.parent("canvas-container");
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);
}

function draw() {
  background(0);
  image(video, 0, 0);

  rightHand = null;
  leftHand = null;

//   assign finger positions to dictionary
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.handedness == 'Right') {
        let thumb = hand.thumb_tip;
        let index = hand.index_finger_tip;
        let middle = hand.middle_finger_tip;
        let ring = hand.ring_finger_tip;
        let pinky = hand.pinky_finger_tip;
        rightHand = { thumb, index, middle, ring, pinky};
      }

      if (hand.handedness == 'Left') {
        let thumb = hand.thumb_tip;
        let index = hand.index_finger_tip;
        let middle = hand.middle_finger_tip;
        let ring = hand.ring_finger_tip;
        let pinky = hand.pinky_finger_tip;
        leftHand = { thumb, index, middle, ring, pinky, keypoints: hand.keypoints};
      }
    }
    
//    when lefthand shows 1 or 2, change the mode of color
    if (leftHand) {
      let { thumb, index, middle, ring, pinky } = leftHand;
//    judge by distance of index/middle to other fingers   
      if (index.y + 100 < middle.y && index.y +100 < ring.y  && index.y + 100 < thumb.y) {
        mode = 1;       
      }
      if (index.y +100 < ring.y  && index.y + 100 < thumb.y && index.y + 100 < pinky.y && middle.y + 100 < thumb.y && middle.y + 100 < ring.y && middle.y + 100 < pinky.y) {
        mode = 2;
      }
    }
    
    if (rightHand && rightHandPrevious && rightHandPrevious.index) {
//      get position/previous position and calculate distance between fingers
      let { thumb, index, middle, ring, pinky } = rightHand;
      let { thumb: thumbP, index: indexP, middle: middleP, ring: ringP, pinky: pinkyP } = rightHandPrevious;
      rightHandDistances = {
        thumbD: dist(thumb.x, thumb.y, index.x, index.y),
        indexD: dist(index.x, index.y, middle.x, middle.y),
        middleD: dist(middle.x, middle.y, ring.x, ring.y),
        ringD: dist(ring.x, ring.y, pinky.x, pinky.y),
        fullD: dist(pinky.x, pinky.y, thumb.x, thumb.y)
      };
//       get distance/ previous distance between fingers
      let { thumbD, indexD, middleD, ringD, fullD} = rightHandDistances;
      let {thumbD: thumbDP, indexD: indexDP, middleD: middleDP, ringD: ringDP, fullD: fullDP} = rightHandDistancesP;
      
//       distance difference of index finger to previous frame
      let d = dist(index.x, index.y, indexP.x, indexP.y);

      
//    particle trigger when hand swing; add particles according to mode
      if (indexD < 90 && middleD < 90 && d > 10) {
        for (let i = 0; i < 3; i++) {
          if (mode == 1) {
            particles.push(new Particle(index.x, index.y, random(-1, 1), random(-2, 2), random(6, 12),0));
          }
          if (mode == 2) {
            particles.push(new Particle(index.x, index.y, random(-1, 1), random(-2, 2), random(6, 12), 80));
          }
        }       
      }

//       star strigger when index finger point up & still; add star according to mode
      if (index.y + 100 < middle.y && index.y +100 < ring.y  && index.y + 100 < thumb.y && d < 5) {
        stillCount ++;
      } else {
        stillCount = 0;
      }
      
      if (stillCount >= 10 && starCooldown == 0) {
        if (mode ==1 ) {
          stars.push(new Star(index.x, index.y, random(18, 28), 0));
        }
        
        if (mode ==2 ) {
          stars.push(new Star(index.x, index.y, random(18, 28), 60));
        }
        
        starCooldown = 100;
        stillCount = 0;
      }         
      if (starCooldown > 0) {
        starCooldown--;
      }
//       magic circle trigger when hand open; draw according to mode
      if (thumbD-thumbDP > 3 && indexD-indexDP > 3 && middleD-middleDP > 3 && ringD-ringDP > 3 && indexP.y > index.y){
        openCount++;  
          } else if  (thumbDP-thumbD > 3 || indexDP-indexD > 3 || middleDP-middleD > 3 || ringDP-ringD > 3) {
            openCount = 0;
          }
      if (openCount >= 2 && magicCooldown ==0) {
        let centerX = (thumb.x + pinky.x) / 2;
        let centerY = (thumb.y + pinky.y) / 2;
        if (mode == 1) {
          magics.push(new Magic(centerX, centerY, fullD/2, 0));
        }
        if (mode == 2) {
          magics.push(new Magic(centerX, centerY, fullD/2, 70));
        }
        magicCooldown = 100;
        openCount = 0;
      } 
      if (magicCooldown > 0) {
        magicCooldown--;
   }
  }
  }
  handleClearGesture();
  elementsManage();
// update data in previous frame
  if (rightHand) {
    rightHandPrevious = rightHand;
    rightHandDistancesP= rightHandDistances;
  }

  if (leftHand) {
    leftHandPrevious = leftHand;
  }

  // show color mode
  push();
  fill(255);
  noStroke();
  textSize(16);
  textAlign(RIGHT, BOTTOM);
  text("Current color scheme: " + mode, width - 15, height - 15);
  pop();
  
}

// display and update objects 
function elementsManage() {
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].display();
    if (particles[i].transparency <= 0 || particles[i].size < 1) {
      particles.splice(i, 1);
    }
  }
  
    for (let i = 0; i < stars.length; i++) {
    stars[i].display();
  }
    for (let i = 0; i < magics.length; i++) {
    magics[i].display();
    magics[i].update();
    if (magics[i].transparency <= 0) {
      magics.splice(i,1);
    }
  }
}

function handleClearGesture() {
  let isFist = false;

  if (leftHand) {
    let points = leftHand.keypoints;
    let wrist = points[0];

    //fingertip and corresponding finger joints
    let fingers = [
      [leftHand.index, points[6]],
      [leftHand.middle, points[10]],
      [leftHand.ring, points[14]],
      [leftHand.pinky, points[18]]
    ];

    // judge if fingertips are more closer to wrist than joints
    isFist = fingers.every(([tip, joint]) => {
      let tipDistance = dist(
        tip.x, tip.y, wrist.x, wrist.y
      );

      let jointDistance = dist(
        joint.x, joint.y, wrist.x, wrist.y
      );

      return tipDistance < jointDistance;
    });
  }

  // when left hand is not fist, 
  if (!isFist) {
    fistStartTime = null;
    clearTriggered = false;
    return;
  }

  // start timer whe first detect fist
  if (fistStartTime === null) {
    fistStartTime = millis();
  }

  // trigger when detect fist for a period of time
  if (millis() - fistStartTime >= 1000 && !clearTriggered) {
    stars = [];
    magics = [];

    stillCount = 0;
    openCount = 0;
    starCooldown = 100;
    magicCooldown = 100;

    clearTriggered = true;
  }
}

// object particles, random movemnets and dimmer, smaller over time
class Particle {
  constructor(x, y, vx, vy, size, shift) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.shift = shift;
    this.transparency = 255;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.transparency -= 5;
    this.size *= 0.95;
  }

//   two layers of circles
  display() {
    push();
    noStroke();

    let red = 160 + this.shift;
    let green = 200 - this.shift;
    let blue = 255 - this.shift;

    drawingContext.shadowColor = `rgb(${red}, ${green}, ${blue})`;
    drawingContext.shadowBlur = 12;
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;

    fill(red, green, blue, this.transparency * 0.5);
    ellipse(this.x, this.y, this.size * 1.8);

    drawingContext.shadowColor = `rgb(255, 255, 255)`

    fill(255, 255, 255, this.transparency);
    ellipse(this.x, this.y, this.size * 0.8);

    pop();
  }
}

// object star
class Star {
  constructor(x, y, r, shift) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.shift = shift;
    this.phase = random(TWO_PI);
  }

  display() {
    push();
    noStroke();

    let pulse = (sin(millis() * 0.003 + this.phase) + 1) / 2;
    let red = 255 - this.shift;
    let green = 240 - this.shift;
    let blue = 120 + 2 * this.shift;

    // Colored glow.
    drawingContext.shadowColor = `rgb(255, 255, 255)`;
    drawingContext.shadowBlur = 16 + pulse * 12;
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;

    fill(red, green, blue);
    star(this.x, this.y, this.r * 0.6, this.r * 1.4, 5);

    // Soft highlight inside the star.
    drawingContext.shadowBlur = 0;

    fill(red, green-20, blue-20, 35 + pulse * 40);
    star(this.x, this.y, this.r * 0.22, this.r * 0.65, 5);

    pop();
  }
}

// object of magic circle
class Magic {
  constructor(x, y, r, shift) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.shift = shift;
    this.transparency = 255;
    this.strokeW= this.r * 0.04
  }

  update () {
    this.transparency-=3;
  }
  
//   two layers, each layer: one circle, one star and polygon inside
  display() {
    noFill();
     
    let red = 211-this.shift/2;
    let green = 149+this.shift;
    let blue = 255-this.shift;

    stroke(red, green, blue, this.transparency * 0.7);
    strokeWeight(this.strokeW);

    drawingContext.shadowColor = `rgb(${red}, ${green}, ${blue})`;
    drawingContext.shadowBlur = 15;
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;

    ellipse(this.x, this.y, this.r * 2);
    star(this.x, this.y, this.r * 0.38, this.r * 0.9, 5);
    polygon(this.x, this.y, this.r * 0.38, 5);
    
    stroke(255, 255, 255, this.transparency);
    strokeWeight(this.strokeW * 0.3);

    ellipse(this.x, this.y, this.r * 2);
    star(this.x, this.y, this.r * 0.38, this.r * 0.9, 5);
    polygon(this.x, this.y, this.r * 0.38, 5);

  }
}

function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function polygon(x, y, radius, npoints) {
  let angle = TWO_PI / npoints;
  beginShape();
  for (let a = angle/2; a < TWO_PI + angle/2; a += angle) {
    let sx = x + cos(a) * radius;
    let sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}