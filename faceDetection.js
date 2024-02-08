var accessGranted = false;
var running = false;
var modelOutput = null;

// the link to the model
const URL = "https://teachablemachine.withgoogle.com/models/l4Oo33mJS/";

let model, webcam, labelContainer, maxPredictions;

// Wait for the DOM to be ready before trying to access the video element (otherwise it might not be loaded yet)
document.addEventListener("DOMContentLoaded", async function (event) {
  //-----------------Set up the model-----------------
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

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
});

// Set up the webcam and start the video playback
async function startWebcam() {
  // If the access has already been granted, don't request it again
  if (accessGranted) {
    console.log("Access already granted!"); // Maybe add a message to the user alerts or smt??
    return;
  }

  // Convenience function to setup a webcam
  const flip = true; // whether to flip the webcam
  webcam = new tmImage.Webcam(640, 480, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play(); // Start taking webcam input
  window.requestAnimationFrame(loop); // Start updating the webcam frame (playback)

  document.getElementById("webcam-container").appendChild(webcam.canvas); // Add webcam playback to page
  document.getElementById('webcam-placeholder').style.display = 'none'; // Hide placeholder

  accessGranted = true;// Enable the flag
}

// Stop the webcam and remove the video playback
function stopWebcam() {
  // If the access to the webcam hasn't been granted yet, don't stop it
  if(!accessGranted) {
    console.log("No webcam access to stop!");
    return;
  }

  webcam.stop(); // Stop the webcam
  webcam.canvas.remove(); // Remove webcam playback from page
  window.cancelAnimationFrame(loop); // Stop updating the webcam frame

  document.getElementById('webcam-placeholder').style.display = 'block'; // Toggle placeholder
  accessGranted = false; // Disable the flag
}

// Loop to keep updating the webcam frame
async function loop() {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loop); // request the next frame
}

// run the webcam image through the image model
async function predict() {
  // predict can take in an image, video or canvas html element
  const prediction = await model.predict(webcam.canvas); // The input of this function will be the output of opencv once done
  modelOutput = prediction; // Make prediction available to other functions
  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className + ": " + prediction[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }
}

// Begin the music selection
function startMusicSelection() {
  if (running) {
    console.log("Music selection already running!");
    return;
  }

  if (!accessGranted) {
    alert("Please start the webcam first!");
    return;
  }

  running = true;
  alert("Placeholder for starting music selection");

  /*while (running) {
    // do some function based on the modelOutput variable
  }*/ // (Either find a way to run this in the background or use a different approach to run the music selection as
  // the while loop will block the rest of the code from running until it's done)
  alert("music selection stopped")
}

// Stop the music selection
function stopMusicSelection() {
  if (!running) {
    console.log("No music selection to stop!");
    return;
  }

  alert("Placeholder for stopping music selection");
  running = false;
}

