var accessGranted = false; // Flag to check if the webcam access has been granted
var running = false; // Flag to check if the music selection process is running (face detection, emotion prediction, music selection)
var musicPlaying = false; // Flag to check if music is currently playing
var showLabels = false; // Flag to see whether all labels are to be displayed
var showBoundingBoxes = false; // Flag to see whether bounding boxes should be drawn on detected faces
var mostLikelyEmotion = ""; // The most likely emotion detected by the model
var sideContainer; // The container for the side panel showing the labels
var displayWebcamAndLabels = true;

// The link to the model - realistically you'd want to hide this in a .env file or something
const URL = "https://teachablemachine.withgoogle.com/models/l4Oo33mJS/";

let model, webcam, labelContainer, maxPredictions; // Variables used by the model

var mostLikelyEmotionDisplay; // May or may not remove - used to display the most likely emotion, used as an exercise to extract the most likely emotion from the model

// Wait for the DOM to be ready before trying to access the video element (otherwise it might not be loaded yet)
document.addEventListener("DOMContentLoaded", async function (event) {
  //-----------------Set up the model-----------------
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  mostLikelyEmotionDisplay = document.getElementById("emotion");
  sideContainer = document.getElementById("side-container");

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // or files from your local hard drive
  // Note: the pose library adds "tmImage" object to your window (window.tmImage)
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

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
    function() {
      if (!infoArea.classList.contains("active")) {
        infoArea.classList.add("active");
      }
    }
  );

  // Add event listener to hide info
  hideInfoButton.addEventListener("click",
    function() {
      animateAndHide(infoArea, "inactive", 498, "active"); // hide slightly before removing the active class
    }
  );
});

// Function to display modal with message for error handling
function displayModal(message) {
  const modal = document.getElementById('modalPopup');
  const modalMessage = document.getElementById('modal-message');
  modalMessage.textContent = message;
  modal.style.display = "block";

  // Close modal when user clicks on close button
  const closeBtn = document.getElementsByClassName("close")[0];
  closeBtn.onclick = function() {
    modal.style.display = "none";
  }
}

// Function to animate and hide an element
function animateAndHide(element, animationClass, duration, removeClass = null) {
  element.classList.add(animationClass);
  setTimeout(
    function() {
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

  document.getElementById("webcam-container").appendChild(webcam.canvas); // Add webcam playback to page
  document.getElementById('webcam-placeholder').style.display = 'none'; // Hide placeholder

  accessGranted = true;// Enable the flag

  // Change the button text to 'Disable Webcam'
  document.getElementById("toggleCam").innerHTML = "Disable Webcam";
}

// Stop the webcam and remove the video playback
function stopWebcam() {
  // If the access to the webcam hasn't been granted yet, don't stop it
  if(!accessGranted) {
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
    sideContainer.style.display="None";
    showLabelsButton.innerHTML = "Show Labels";
  }

}

// Function to toggle the visual display (Playback and labels)
function toggleDisplay() {
  displayWebcamAndLabels = !displayWebcamAndLabels;
  var container = document.getElementById("webcam-and-labels-container");
  var button = document.getElementById("toggleDisplay");

  var additionalButtons = document.getElementById("extraButtons");

  if(displayWebcamAndLabels) {
    container.style.display = "Flex";
    button.innerHTML = "Hide Display";

    if(running) {
      additionalButtons.style.display = "Flex";
    }
  }
  else {
    container.style.display = "None";
    button.innerHTML = "Show Display";

    if(running) {
      additionalButtons.style.display = "None";
    }
  }
}

// Loop to keep updating the webcam frame (and do more if music selection is running)
async function loop() {
  webcam.update(); // update the webcam frame

  // If the music selection process is running, run the face detection, emotion prediction and music selection
  if (running) {
    detectFace(); // Detect a face in the webcam frame
    predict(); // Predict the emotion of the face
    selectMusic(); // Select music based on the predicted emotion
    // Consider different music selection logic e.g taking the highest value over a period of time rather than just the current frame
  }

  window.requestAnimationFrame(loop); // request the next frame
}

// run the webcam image through the image model
async function predict() {
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

  if(displayWebcamAndLabels) {
    // Hide bounding boxes button and labels button
    document.getElementById("extraButtons").style.display = "None";
  }

  // Disable labels if activated
  if(showLabels) {
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
function detectFace() {
  // Get video element from webcam to base the detection on
  video = webcam.canvas; 

  // Face detection logic goes here
}