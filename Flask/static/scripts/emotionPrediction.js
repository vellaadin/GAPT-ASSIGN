
var model; // The model used for emotion prediction
var modelLoaded = false; // Flag to see whether the model has been loaded
var labelContainer; // The container for the labels
var maxPredictions; // The maximum number of predictions
var mostLikelyEmotion = ""; // The most likely emotion detected by the model
var mostLikelyEmotionDisplay; // Container for the most likely emotion

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
        utils.displayModal("Error loading image model");
    }
}

// run the webcam image through the image model
async function predict () {
    try {
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
    } catch (error) {
        console.error("Error predicting emotion: ", error);
    }
}
