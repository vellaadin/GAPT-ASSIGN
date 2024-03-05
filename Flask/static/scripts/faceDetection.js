
//----------- Local variables ------------//
var OpenCVReady = false; // Flag to see whether OpenCV is ready
var cascadeLoaded = false; // Flag to see whether the cascade has been loaded
var showBoundingBoxes = false; // Flag to see whether bounding boxes should be drawn on detected faces
var faceDetected = false; // Flag to see whether a face has been detected

var faceCascade; // The face cascade used for face detection
var cap; // The video capture object for OpenCV
var webcamPlayback; // The video element for the webcam playback
var mediaStream; // The media stream from the webcam
var cvCanvas; // The canvas for the OpenCV output
var loadCascadeAttempts = 0; // The number of times the cascade has been attempted to be loaded

// Function to ensure OpenCV is loaded before trying to use it
function openCVLoaded() {
    console.log("OpenCV onload triggered, waiting 1 second to ensure OpenCV is fully loaded");
    setTimeout(function () {
        OpenCVReady = true;
        console.log("OpenCV is ready");
        loadCascade();
    }, 1000); // 1 second delay to ensure OpenCV is fully loaded
};

// Function to load the face cascade
function loadCascade() {
    if (OpenCVReady) {
        const cascadeUrl = "https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalcatface.xml";
        // ^ Use above URL to load the cascade from the internet if the local file doesn't work
        faceCascade = new cv.CascadeClassifier();

        // use createFileFromUrl to create virtual file from the URL
        utils.createFileFromUrl('/face_cascade', '/face_cascade', () => {
            faceCascade.load('/face_cascade');
        });

        setTimeout(function () {

            if (faceCascade.empty()) {
                console.error('Failed to load face cascade');
                utils.displayModal("Failed to load face cascade");
            }
            else {
                cascadeLoaded = true;
                console.log("Cascade loaded");
            }
        }, 1000); // 1 second delay to ensure the cascade is fully loaded
    }
    else {
        console.log("OpenCV not ready yet, waiting 1 second to try again (attempt " + ++loadCascadeAttempts + ")");
        if (loadCascadeAttempts < 5) {
            setTimeout(loadCascade, 1000);
        }
        else {
            console.log("OpenCV not ready after 5 attempts, cascade not loaded");
        }
    }
}

// Function to detect a face in the webcam frame
async function detectFace() {
    try {
        if (!faceCascade || !OpenCVReady) {
            console.log("Cascade not loaded or OpenCV not ready");
            return;
        }

        // Old code (for reference or whatever)
        //let src = cv.imread(webcam.canvas); // Note using cap.read seems slower (bigger frame size?)

        //converting webcam canvas to mat obj for opencv
        let src = new cv.Mat(webcam.canvas.height, webcam.canvas.width, cv.CV_8UC4);
        cap.read(src); // Read the frame from the webcam
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        //face detection
        let faces = new cv.RectVector();
        let detectSize = new cv.Size(0, 0); // Use a small size for faster detection, adjust based on your needs 
        let minNeighbours = 3; // Lower value for faster detection, higher value for more reliable detection
        let scaleFactor = 1.15; // Higher value for faster detection, lower value for more reliable detection
        let flags = 0; // 0 for default (not sure what it does)
        faceCascade.detectMultiScale(gray, faces, scaleFactor, minNeighbours, flags, detectSize, detectSize);

        //checking if min. of one face detected
        if(faces.size() > 0){
            //getting first face detected
            let face = faces.get(0);
            let faceRectangle = new cv.Rect(face.x, face.y, face.width, face.height);

            //crop detected face
            let croppedFace = src.roi(faceRectangle);

            //convert to grayscale
            let grayCroppedFace = new cv.Mat();
            cv.cvtColor(croppedFace, grayCroppedFace, cv.COLOR_RGBA2GRAY, 0);

            //resize cropped face
            let dsize = new cv.Size(224, 224);
            let resizedGrayFace = new cv.Mat();
            cv.resize(grayCroppedFace, resizedGrayFace, dsize, 0, 0, cv.INTER_AREA); //this is to be passed to model

            //(just for now) displaying resized face on dedicated canvas
            cv.imshow('croppedFaceCanvas', resizedGrayFace);

            // Show Canvas
            document.getElementById('croppedFaceCanvas').style.display = 'block';

            // Ensure placeholder is hidden
            document.getElementById('croppedFacePlaceholder').style.display = 'none';

            //clean up
            croppedFace.delete();
            grayCroppedFace.delete();
            resizedGrayFace.delete();

            faceDetected = true;
        }
        else {
            faceDetected = false;
            // Hide Canvas
            document.getElementById('croppedFaceCanvas').style.display = 'none';

            // Show placeholder
            document.getElementById('croppedFacePlaceholder').style.display = 'flex';
        }

        //if flag set, draw bounding box
        if (showBoundingBoxes) {
            for (let i = 0; i < faces.size(); ++i) {
                let face = faces.get(i);
                let point1 = new cv.Point(face.x, face.y);
                let point2 = new cv.Point(face.x + face.width, face.y + face.height);
                cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
            }
            //display results
            cv.imshow('canvasOutput', src);
        }

        // Clean up
        src.delete();
        gray.delete();
        faces.delete();
    } catch (error) {
        console.error("Error detecting face: ", error);
        utils.logOpenCVError(error);
    }
}
