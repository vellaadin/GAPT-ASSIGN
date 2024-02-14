# GAPT-ASSIGNMENT: Emotion-driven music player

## Rundown of current work

The general framework of the site has been done (feel free to change/improve should you like but ideally mention changes to facilitate merging our work)

Currently the user has 4 button they can select:
Enable/Disable Webcam which enable/disable the webcam and playback, and Start/Stop which enable/disable the music selection process.  
The music selection process entails the following:  
- First faces are detected in the webcam feed
- These faces are fed to the classification model which classifies the emotion
- This emotion is used to select a music track if no music is currently running  

Should you have any questions feel free to ask, styling is done just to get by for now (for practicality) and should be improved later on.

Ideally do work in a new branch to make life easier :))

## Work to be done:
- Facial detection component (use opencv to detect faces)
- Music selection component (logic to select a music track given a predicted emotion)
- Finding music
- Further site building and styling

## Using flask:
In order to launch flask run the flask-app.py script, once done you can connect to the site through 'http://localhost:5000/'


## Useful GAPT Proposal Information:
### Title
Emotion-driven music player: a hands-on computer vision,  
machine learning and human-computer interaction project
 
### Short Description of Task
The aim of this project involves the creation of a music 
player capable of selecting songs according to the user's present emotional state, as 
determined by their facial expressions. This endeavor offers students the chance to 
delve into computer vision, machine learning, and human-computer interaction, all 
while tackling a practical problem and its real-world application. Throughout the 
project, open-source tools and publicly available datasets will be used. 
 
### Deliverables
1) A web-based application,  
2) A report describing your approach and your findings,  
3) a short demo video
 
