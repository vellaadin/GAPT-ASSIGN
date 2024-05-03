/*
    Main script for the web application
*/

//----------------------------- Global Variables ----------------------------//

//----------------- Flags -----------------//
var accessGranted = false; // Flag to check if the webcam access has been granted
var running = false; // Flag to check if the music selection process is running (face detection, emotion prediction, music selection)
var musicPlaying = false; // Flag to check if music is currently playing
var showLabels = false; // Flag to see whether all labels are to be displayed
var displayWebcamAndLabels = true; // Flag to see whether the webcam and labels are to be displayed
var showCroppedFace = false; // Flag to see whether the cropped face is to be displayed


var sideContainer; // The container for the side panel showing the labels
var croppedFaceCanvas; // The canvas containing the greyscale cropped face from the webcam frame (to be used for emotion prediction)

//----------------------------- Initialisation ----------------------------//

// Wait for the DOM to be ready before trying to access the video element (otherwise it might not be loaded yet)
document.addEventListener("DOMContentLoaded", async function (event) {
    //-----------------Set up the webcam-----------------
    webcamPlayback = document.getElementById("webcamPlayback");
    cvCanvas = document.getElementById("canvasOutput");
    croppedFaceCanvas = document.getElementById("croppedFaceCanvas");
    // Flip the video
    webcamPlayback.style.transform = "scale(-1, 1)";
    cvCanvas.style.transform = "scale(-1, 1)";
    croppedFaceCanvas.style.transform = "scale(-1, 1)";
    context = cvCanvas.getContext('2d');

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
            utils.animateAndHide(infoArea, "inactive", 498, "active"); // hide slightly before removing the active class
        }
    );
});

//---------------------------- Toggle Functions ----------------------------//

// Function to toggle the display of labels (probability of each emotion)
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

// Function to toggle the visual display (Webcam playback and labels)
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

        if (showCroppedFace) {
            document.getElementById("cropped-face-container").style.display = "Block";
        }
    }
    else {
        container.style.display = "None";
        button.innerHTML = "Show Display";

        if (running) {
            additionalButtons.style.display = "None";
        }

        if (showCroppedFace) {
            document.getElementById("cropped-face-container").style.display = "None";
        }
    }
}

// Function to toggle the webcam (enable/disable)
function toggleWebcam() {
    if (accessGranted) {
        stopWebcam();
    } else {
        startWebcam();
    }
}

// Function to toggle the music selection process
function toggleMusicSelection() {
    if (running) {
        stopMusicSelection();
    } else {
        startMusicSelection();
    }
}

// Function to toggle drawing of bounding boxes around detected faces
function toggleBoundingBoxes() {

    showBoundingBoxes = !showBoundingBoxes;
    if (showBoundingBoxes) {
        // Draw bounding boxes
        document.getElementById("toggleBoundingBoxes").innerHTML = "Hide Bounding Boxes";
        document.getElementById("canvasOutput").style.display = "Block";
        document.getElementById("opencv-container").style.display = "Flex";
        document.getElementById("webcam-container").style.display = "None";
    }
    else {
        // Remove bounding boxes
        document.getElementById("toggleBoundingBoxes").innerHTML = "Show Bounding Boxes";
        document.getElementById("canvasOutput").style.display = "None";
        document.getElementById("opencv-container").style.display = "Flex";
        document.getElementById("webcam-container").style.display = "Flex";
    }
}

function toggleCroppedFace() {
    showCroppedFace = !showCroppedFace;
    if (showCroppedFace) {
        // Draw cropped face
        document.getElementById("toggleCroppedFace").innerHTML = "Hide Cropped Face";
        document.getElementById("cropped-face-container").style.display = "Block";
    }
    else {
        // Remove cropped face
        document.getElementById("toggleCroppedFace").innerHTML = "Show Cropped Face";
        document.getElementById("cropped-face-container").style.display = "None";
    }
}

//----------------------------- Webcam Functions ----------------------------//

// Set up the webcam and start the video playback
async function startWebcam() {
    // If the access has already been granted, don't request it again
    if (accessGranted) {
        console.log("Access already granted!"); // Maybe add a message to the user alerts or smt??
        return;
    }

    if (!OpenCVReady) {
        utils.displayModal("OpenCV not loaded, please try again later");
        return;
    }

    // Webcam setup options
    const flip = true; // Whether to flip the webcam
    const width = 640; // Width of the webcam frame
    const height = 480; // height of the webcam frame

    // Try to access the webcam
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamPlayback.srcObject = mediaStream;
        cap = new cv.VideoCapture(webcamPlayback);
    } catch (error) {
        utils.displayModal("Couldn't access the webcam");
        console.error("Couldn't accessing webcam:", error);
    }

    // TODO - once done and image model uses the output of opencv, remove the below code (remove all references to webcam)
    try {
        // Try to access the webcam
        webcam = new tmImage.Webcam(width, height, flip); // width, height, flip
        await webcam.setup(); // Request access to the webcam
    } catch (e) {
        utils.displayModal("Couldn't access the webcam");
        console.log("Couldn't access the webcam: " + e); // Maybe change to a more user-friendly alert
        return;
    }


    await webcam.play(); // Start taking webcam input
    window.requestAnimationFrame(loop); // Start updating the webcam frame (playback)

    // Show the webcam container
    const webcamContainer = document.getElementById("webcam-container");
    webcamContainer.style.display = "flex"; // Show the webcam container
    //webcamContainer.appendChild(webcam.canvas); // Add webcam playback to page

    // Hide placeholder
    document.getElementById('webcam-placeholder').style.display = 'none';

    //canvasDOM = document.getElementById('webcam-container').getElementsByTagName('canvas')[0];

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
        utils.displayModal("Please stop the music selection first!");
        return;
    }

    mediaStream.getTracks().forEach(track => track.stop());
    //webcamPlayback.srcObject = null;

    webcam.stop(); // Stop the webcam
    //webcam.canvas.remove(); // Remove webcam playback from page

    window.cancelAnimationFrame(loop); // Stop updating the webcam frame

    document.getElementById('webcam-placeholder').style.display = 'flex '; // Toggle placeholder
    document.getElementById('webcam-container').style.display = 'none'; // Hide the webcam container
    accessGranted = false; // Disable the flag

    // Change the button text to 'Enable Webcam'
    document.getElementById("toggleCam").innerHTML = "Enable Webcam";
}

//----------------------------- Music Selection Functions ----------------------------//

// Begin the music selection
function startMusicSelection() {
    if (running) {
        console.log("Music selection already running!");
        return;
    }

    if (!accessGranted) {
        utils.displayModal("Please start the webcam first!"); // Maybe change to a more user-friendly alert
        return;
    }

    if (!cascadeLoaded) {
        utils.displayModal("Cascade not loaded, unable to detect faces!");
        return;
    }

    if (!modelLoaded) {
        utils.displayModal("Model not loaded, unable to identify emotions!");
        return;
    }

    running = true;

    // Change the button text to 'Stop'
    document.getElementById("toggleMusicSelection").innerHTML = "Get Music Recommendation";

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

    // If bounding boxes are activated, disable them
    if (showBoundingBoxes) {
        toggleBoundingBoxes();
    }

    // If cropped face is activated, disable it
    if (showCroppedFace) {
        toggleCroppedFace();
    }

    // Disable labels if activated
    if (showLabels) {
        toggleLabels();
    }
    // Disable most likely emotion display
    document.getElementById("emotion-container").style.display = "None";

    selectMusic();

    // Enable emotion score display
    document.getElementById("emotionScores").style.display = "Block";

    // Redirect the user to the music player
    var musicPlayer = document.getElementById("music-section");
    musicPlayer.scrollIntoView({ behavior: "smooth" });
}

//----------------------------- Main Loop ----------------------------//

// Loop to keep updating the webcam frame (and do more if music selection is running)
async function loop() {
    webcam.update(); // update the webcam frame

    // If the music selection process is running, run the face detection, emotion prediction and music selection
    if (running) {
        await detectFace(); // Detect a face in the webcam frame
        await predict(); // Predict the emotion of the face
    }

    window.requestAnimationFrame(loop); // request the next frame
}