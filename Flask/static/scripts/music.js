var emotionScores = [0, 0, 0, 0, 0, 0, 0];
var emotionNames = ["Sad", "Surprise", "Neutral", "Happy", "Fear", "Disgust", "Angry"];
var total_iterations = 0;

function resetEmotionScores() {
    emotionScores = [0, 0, 0, 0, 0, 0, 0];
    total_iterations = 0;
}

function chooseEmotion() {
    var maxEmotion = 0;
    var maxEmotionIndex = 2; // Default to Neutral
    for (var i = 0; i < emotionScores.length; i++) {
        if (emotionScores[i] > maxEmotion) {
            maxEmotion = emotionScores[i];
            maxEmotionIndex = i;
        }
    }
    return emotionNames[maxEmotionIndex];
}

// Used for displaying the scores of each emotion
function normaliseEmotionScores() {
    for (var i = 0; i < emotionScores.length; i++) {
        emotionScores[i] = emotionScores[i] / total_iterations;
        // Round to 2 decimal places
        emotionScores[i] = Math.round(emotionScores[i] * 100) / 100;
    }

    total_iterations = 1;
}

// Function to select music based on the detected emotion
function selectMusic() {
    // If music is already playing, don't start it again
    if (musicPlaying) {
        console.log("Music already playing!"); // Remove eventually as it will flood the console
        return;
    }

    // Normalise the emotion scores
    normaliseEmotionScores();
    // Update the table with the emotion scores
    updateEmotionsTable();

    var chosen_emotion = chooseEmotion();
    // Reset the emotion scores for the next iteration
    resetEmotionScores();

    possible_emotions = ["Sad", "Surprise", "Neutral", "Happy", "Fear", "Disgust", "Angry"];

    if (possible_emotions.includes(chosen_emotion)) {
        fetchPlaylistAndPlay(chosen_emotion);
    }
    else {
        console.error("Emotion not recognized");
    }
}

// Function to select music based on the detected emotion
function fetchPlaylistAndPlay(emotion) {
    var valid_emotion = false;
    var emotion_request = "NULL";
    try {
        emotion_request = emotion.toLowerCase() + "_playlist";
        valid_emotion = true;
    }
    catch (error) {
        console.error("Error: Unable to convert emotion to lowercase. Error: ", error);
        valid_emotion = false;
    }

    if (!valid_emotion) {
        console.error("Error: Invalid emotion. Unable to fetch playlist.");
        return;
    }

    // Update the music message based on the detected emotion
    updateMusicMessage(emotion);

    // Make an HTTP GET request to your Flask endpoint based on the emotion
    fetch('/' + emotion_request)
        .then(response => response.json())
        .then(data => {
            // Get a random index from the received playlist data
            const randomIndex = Math.floor(Math.random() * data.length);

            // Get the URL of the randomly selected track
            const randomTrackUrl = data[randomIndex].url;

            // Update the src attribute of the musicPlayerIframe with the random track URL
            const musicPlayerIframe = document.getElementById('musicPlayerIframe');
            musicPlayerIframe.src = randomTrackUrl;
        })
        .catch(error => {
            console.error('Error fetching playlist:', error);
        });
}

// Function to update the music message based on the detected emotion
function updateMusicMessage(emotion) {
    // Get the container for the music message
    const musicMessageContainer = document.getElementById("musicMessage");

    // Check if the musicMessageContainer is found
    if (!musicMessageContainer) {
        console.error("Error: Music message container not found.");
        return;
    }

    // Define messages based on different emotions
    const messages = {
        "Sad": "Feeling sad? Here's some sad music to match your mood.",
        "Surprise": "Surprised? Enjoy some music to match your mood.",
        "Neutral": "Feeling neutral? Let's spice things up with some tunes.",
        "Happy": "Happy vibes incoming! Here's some music to keep the smiles going.",
        "Fear": "Feeling fearful? Relax with some soothing music.",
        "Disgust": "Feeling disgusted? Here's some music to help you unwind.",
        "Angry": "Feeling angry? Let it all out by singing along."
    };

    // Check if the provided emotion is valid
    if (!messages.hasOwnProperty(emotion)) {
        console.error(`Error: Invalid emotion: ${emotion}`);
        return;
    }

    // Construct and update the message based on the detected emotion
    const message = `${messages[emotion]}`;

    // Check if the message is empty or null
    if (!message) {
        console.error("Error: Unable to generate music recommendation.");
        return;
    }

    // Update the content of the music message container
    musicMessageContainer.textContent = message;
}

// Function to update the table with the emotion scores
function updateEmotionsTable() {
    // Get references to the table rows
    //var tableBody = document.querySelector('#emotionTable tbody');
    var labelsRow = document.getElementById('emotionTableHeader');
    var scoresRow = document.getElementById('emotionTableData');

    // Clear existing data
    labelsRow.innerHTML = '';
    scoresRow.innerHTML = '';

    // Loop through the arrays and create table cells dynamically
    for (var i = 0; i < emotionScores.length; i++) {
        var labelCell = document.createElement('td');
        labelCell.textContent = emotionNames[i];
        labelsRow.appendChild(labelCell);

        var scoreCell = document.createElement('td');
        scoreCell.textContent = emotionScores[i];
        scoresRow.appendChild(scoreCell);
    }
}