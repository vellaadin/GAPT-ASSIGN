var video;
var stream = null;
var accessGranted = false;
var running = false;

// Wait for the DOM to be ready before trying to access the video element (otherwise it might not be loaded yet)
document.addEventListener("DOMContentLoaded", function(event) {
  video = document.getElementById('videoElement'); // Get the video element

  //-----------------Add event listeners to the buttons-----------------

  // Enable/disable access to the webcam
  document.getElementById('requestButton').addEventListener('click', requestAccess);
  document.getElementById('disableButton').addEventListener('click', stopAccess);

  // Start/stop the video playback
  document.getElementById('startButton').addEventListener('click', startPlayback);
  document.getElementById('stopButton').addEventListener('click', stopPlayback);
});

// Request access to the webcam
function requestAccess() {
  // If the access has already been granted, don't request it again
  if (accessGranted) {
    console.log("Access already granted!");
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: true }).then(function(streamObj) {
    accessGranted = true;
    stream = streamObj;
  }).catch(function(err) {
    console.log("Couldn't request access to the webcam!");
    console.log(err);
  });
}

// Stop access to the webcam
function stopAccess() {
  if (accessGranted) {
    if (running) {
      // If the playback is running, stop it
      stopPlayback();
    }

    // Stop all tracks in the stream
    stream.getTracks().forEach(function(track) {
      track.stop();
    });
    accessGranted = false;
  }
  else {
    console.log("No access to the webcam to stop!");
  }
}

// Right now this is just a placeholder function that starts the video playback
function startPlayback() {
  // If the access to the webcam hasn't been granted yet, request it
  if (!accessGranted) {
    console.log("No access to the webcam");
    return;
  }

  // If the playback is already running, don't start it again
  if (running) {
    console.log("Playback already running!");
    return;
  }

  // If the access to the webcam has been granted, start the playback
  video.srcObject = stream;
  running = true;
}

// Stop the video playback
function stopPlayback() {
  if (video.srcObject){
    video.srcObject = null;
    running = false;
  }
  else {
    console.log("No video source to stop!");
  }
}

