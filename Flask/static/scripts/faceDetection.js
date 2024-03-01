var accessGranted = false; // Flag to check if the webcam access has been granted
var running = false; // Flag to check if the music selection process is running (face detection, emotion prediction, music selection)
var musicPlaying = false; // Flag to check if music is currently playing
var showLabels = false; // Flag to see whether all labels are to be displayed
var showBoundingBoxes = false; // Flag to see whether bounding boxes should be drawn on detected faces
var mostLikelyEmotion = ""; // The most likely emotion detected by the model
var sideContainer; // The container for the side panel showing the labels
var displayWebcamAndLabels = true;
var faceCascade;
var OpenCVReady = false;
var cascadeLoaded = false;
var modelLoaded = false;
var timeOut = 0;
var canvasDOM;

let model, webcam, labelContainer, maxPredictions; // Variables used by the model

var mostLikelyEmotionDisplay; // May or may not remove - used to display the most likely emotion, used as an exercise to extract the most likely emotion from the model

// Wait for the DOM to be ready before trying to access the video element (otherwise it might not be loaded yet)
document.addEventListener("DOMContentLoaded", async function (event) {
  //-----------------Set up the model-----------------

  // Load the teachable machine model
  await loadImageModel();
  maxPredictions = model.getTotalClasses();

  mostLikelyEmotionDisplay = document.getElementById("emotion");
  sideContainer = document.getElementById("side-container");

  // append elements to the DOM
  labelContainer = document.getElementById("label-container");
  for (let k = 0; k < maxPredictions; k++) { // and class labels
    labelContainer.appendChild(document.createElement("div"));
  }

  //-----------------Set up info trigger-----------------
  const infoButton = document.getElementById("info-button");
  const infoArea = document.getElementById("info-area");
  const hideInfoButton = document.getElementById("hide-info");

  // Add event listener to show info if not already active
  infoButton.addEventListener("click",
    function () {
      if (!infoArea.classList.contains("active")) {
        infoArea.classList.add("active");
      }
    }
  );

  // Add event listener to hide info
  hideInfoButton.addEventListener("click",
    function () {
      animateAndHide(infoArea, "inactive", 498, "active"); // hide slightly before removing the active class
    }
  );
});

// Function to load the teachable machine model from flask
async function loadImageModel() {
  try {
    // Specify paths to the model and metadata files served by Flask
    const modelURL = '/model';
    const metadataURL = '/metadata';

    // Load the model
    model = await tmImage.load(modelURL, metadataURL);
    modelLoaded = true;
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Error loading model:', error);
    displayModal("Error loading image model");
  }
}

// Function to ensure OpenCV is loaded before trying to use it
function openCVLoaded() {
  console.log("OpenCV onload triggered, waiting 1 second to ensure OpenCV is fully loaded");
  setTimeout(function () {
    OpenCVReady = true;
    console.log("OpenCV is ready");
    loadCascade();
  }, 1000); // 1 second delay to ensure OpenCV is fully loaded
}

// Function to load the cascade
function loadCascade() {
  if (OpenCVReady) {
    const cascadeUrl = "https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalcatface.xml";
    // ^ Use above URL to load the cascade from the internet if the local file doesn't work
    faceCascade = new cv.CascadeClassifier();
    faceCascade.load('/face_cascade');
    cascadeLoaded = true;
    console.log("Cascade loaded");
  }
  else {
    console.log("OpenCV not ready yet, waiting 1 second to try again (attempt " + ++timeOut + ")");
    if (timeOut < 5) {
      setTimeout(loadCascade, 1000);
    }
    else {
      console.log("OpenCV not ready after 5 attempts, cascade not loaded");
    }
  }
}

// Function to display modal with message for error handling
function displayModal(message) {
  const modal = document.getElementById('modalPopup');
  const modalMessage = document.getElementById('modal-message');
  modalMessage.textContent = message;
  modal.style.display = "block";

  // Close modal when user clicks on close button
  const closeBtn = document.getElementsByClassName("close")[0];
  closeBtn.onclick = function () {
    modal.style.display = "none";
  }
}

// Function to animate and hide an element
function animateAndHide(element, animationClass, duration, removeClass = null) {
  element.classList.add(animationClass);
  setTimeout(
    function () {
      element.classList.remove(animationClass);
      if (removeClass) { // Case where we want to remove a class after the animation (e.g an active class)
        element.classList.remove(removeClass);
      }
      else {
        element.style.display = "none";
      }
    }, duration
  );
}

// Set up the webcam and start the video playback
async function startWebcam() {
  // If the access has already been granted, don't request it again
  if (accessGranted) {
    console.log("Access already granted!"); // Maybe add a message to the user alerts or smt??
    return;
  }

  // Webcam setup options
  const flip = true; // Whether to flip the webcam
  const width = 640; // Width of the webcam frame
  const height = 480; // height of the webcam frame

  try {
    // Try to access the webcam
    webcam = new tmImage.Webcam(width, height, flip); // width, height, flip
    await webcam.setup(); // Request access to the webcam
  } catch (e) {
    displayModal("Couldn't access the webcam");
    console.log("Couldn't access the webcam: " + e); // Maybe change to a more user-friendly alert
    return;
  }


  await webcam.play(); // Start taking webcam input
  window.requestAnimationFrame(loop); // Start updating the webcam frame (playback)

  const webcamContainer = document.getElementById("webcam-container");
  webcamContainer.style.display = "flex"; // Show the webcam container
  webcamContainer.appendChild(webcam.canvas); // Add webcam playback to page
  document.getElementById('webcam-placeholder').style.display = 'none'; // Hide placeholder
  canvasDOM = document.getElementById('webcam-container').getElementsByTagName('canvas')[0];

  accessGranted = true;// Enable the flag

  // Change the button text to 'Disable Webcam'
  document.getElementById("toggleCam").innerHTML = "Disable Webcam";
}

// Stop the webcam and remove the video playback
function stopWebcam() {
  // If the access to the webcam hasn't been granted yet, don't stop it
  if (!accessGranted) {
    console.log("No webcam access to stop!");
    return;
  }

  if (running) {
    displayModal("Please stop the music selection first!");
    return;
  }

  webcam.stop(); // Stop the webcam
  webcam.canvas.remove(); // Remove webcam playback from page
  window.cancelAnimationFrame(loop); // Stop updating the webcam frame

  document.getElementById('webcam-placeholder').style.display = 'flex '; // Toggle placeholder
  document.getElementById('webcam-container').style.display = 'none'; // Hide the webcam container
  accessGranted = false; // Disable the flag

  // Change the button text to 'Enable Webcam'
  document.getElementById("toggleCam").innerHTML = "Enable Webcam";
}

// Function to toggle the webcam
function toggleWebcam() {
  if (accessGranted) {
    stopWebcam();
  } else {
    startWebcam();
  }
}

// Function to toggle drawing of bounding boxes around detected faces
function toggleBoundingBoxes() {
  displayModal("Placeholder for drawing bounding boxes")

  showBoundingBoxes = !showBoundingBoxes;
  if (showBoundingBoxes) {
    // Draw bounding boxes
    document.getElementById("toggleBoundingBoxes").innerHTML = "Hide Bounding Boxes";
    document.getElementById("canvasOutput").style.display = "Block";
    document.getElementById("webcam-container").style.display = "None";
  }
  else {
    // Remove bounding boxes
    document.getElementById("toggleBoundingBoxes").innerHTML = "Show Bounding Boxes";
    document.getElementById("canvasOutput").style.display = "None";
    document.getElementById("webcam-container").style.display = "Flex";
  }
}

// Function to toggle the display of labels
function toggleLabels(animate = false) {
  showLabels = !showLabels;
  var showLabelsButton = document.getElementById("toggleLabels");

  if (showLabels) {
    sideContainer.style.display = "Block"
    showLabelsButton.innerHTML = "Hide Labels";
  }
  else {
    sideContainer.style.display = "None";
    showLabelsButton.innerHTML = "Show Labels";
  }

}

// Function to toggle the visual display (Playback and labels)
function toggleDisplay() {
  displayWebcamAndLabels = !displayWebcamAndLabels;
  var container = document.getElementById("webcam-and-labels-container");
  var button = document.getElementById("toggleDisplay");

  var additionalButtons = document.getElementById("extraButtons");

  if (displayWebcamAndLabels) {
    container.style.display = "Flex";
    button.innerHTML = "Hide Display";

    if (running) {
      additionalButtons.style.display = "Flex";
    }
  }
  else {
    container.style.display = "None";
    button.innerHTML = "Show Display";

    if (running) {
      additionalButtons.style.display = "None";
    }
  }
}

// Loop to keep updating the webcam frame (and do more if music selection is running)
async function loop() {
  webcam.update(); // update the webcam frame

  // If the music selection process is running, run the face detection, emotion prediction and music selection
  if (running) {
    await detectFace(); // Detect a face in the webcam frame
    await predict(); // Predict the emotion of the face
    selectMusic(); // Select music based on the predicted emotion
    // Consider different music selection logic e.g taking the highest value over a period of time rather than just the current frame
  }

  window.requestAnimationFrame(loop); // request the next frame
}

// run the webcam image through the image model
async function predict() {
  try{
      // predict can take in an image, video or canvas html element
  const prediction = await model.predict(webcam.canvas); // The input of this function will be the output of opencv once done

  let highestProbability = 0; // Used to find the most likely emotion
  let highestEmotion = "";
  for (let i = 0; i < maxPredictions; i++) {
    // Find the most likely emotion
    if (prediction[i].probability > highestProbability) {
      highestProbability = prediction[i].probability;
      highestEmotion = prediction[i].className;
    }

    // Display the prediction
    const classPrediction =
      prediction[i].className + ": " + prediction[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }

  mostLikelyEmotion = highestEmotion; // Make the most likely emotion available to other functions

  // Display the most likely emotion - currently done 'for fun' but could be used to give feedback to the user
  mostLikelyEmotionDisplay.innerHTML = "Most likely emotion: " + highestEmotion + " with a probability of " + highestProbability.toFixed(2);
  }catch(error){
    console.error("Error predicting emotion: ", error);
  }
}

// Begin the music selection
function startMusicSelection() {
  if (running) {
    console.log("Music selection already running!");
    return;
  }

  if (!accessGranted) {
    displayModal("Please start the webcam first!"); // Maybe change to a more user-friendly alert
    return;
  }

  if (!cascadeLoaded) {
    displayModal("Cascade not loaded, unable to detect faces!");
    return;
  }

  if (!modelLoaded) {
    displayModal("Model not loaded, unable to identify emotions!");
    return;
  }

  running = true;

  // Change the button text to 'Stop'
  document.getElementById("toggleMusicSelection").innerHTML = "Stop";

  // Hide the placeholder for the music player
  document.getElementById("musicPlaceHolder").style.display = "None";

  if (displayWebcamAndLabels) {
    // Show bounding boxes button and labels button
    document.getElementById("extraButtons").style.display = "Flex";
  }

  // Enable most likely emotion display
  document.getElementById("emotion-container").style.display = "Block";
}

// Stop the music selection
function stopMusicSelection() {
  if (!running) {
    console.log("No music selection to stop!");
    return;
  }

  running = false;

  // Change the button text to 'Start'
  document.getElementById("toggleMusicSelection").innerHTML = "Start";

  // Show the placeholder for the music player
  document.getElementById("musicPlaceHolder").style.display = "Block";

  if (displayWebcamAndLabels) {
    // Hide bounding boxes button and labels button
    document.getElementById("extraButtons").style.display = "None";
  }

  // Disable labels if activated
  if (showLabels) {
    toggleLabels();
  }
  // Disable most likely emotion display
  document.getElementById("emotion-container").style.display = "None";
}

// Function to toggle the music selection process
function toggleMusicSelection() {
  if (running) {
    stopMusicSelection();
  } else {
    startMusicSelection();
  }
}

// Function to select music based on the detected emotion
function selectMusic() {
  // If music is already playing, don't start it again
  if (musicPlaying) {
    console.log("Music already playing!"); // Remove eventually as it will flood the console
    return;
  }

  // Logic for selecting music - note that the most likely emotion is stored in the variable mostLikelyEmotion
  //console.log("mostLikelyEmotion: " + mostLikelyEmotion); // Remove when done

  // logic
}

// Function to detect a face in the webcam frame
async function detectFace() {
  try{
    if (!faceCascade || !OpenCVReady) {
      console.log("Cascade not loaded or OpenCV not ready");
      return;
    }
  
    //converting webcam canvas to mat obj for opencv
    let src = cv.imread(webcam.canvas);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  
    //face detection
    let faces = new cv.RectVector();
    let detectSize = new cv.Size(0, 0); // Use a small size for faster detection, adjust based on your needs
    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, detectSize, detectSize);
  
    //if flag set, draw bounding box
    if (showBoundingBoxes) {
      for (let i = 0; i < faces.size(); ++i) {
        let face = faces.get(i);
        let point1 = new cv.Point(face.x, face.y);
        let point2 = new cv.Point(face.x + face.width, face.y + face.height);
        cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
      }
    }
  
    //display results
    cv.imshow('canvasOutput', src);
  
    // Clean up
    src.delete();
    gray.delete();
    faces.delete();
  }catch(error){
    console.error("Error detecting face: ", error);
  } 
}
