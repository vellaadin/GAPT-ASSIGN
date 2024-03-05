// General utility functions used throughout the application

const utils = {

    // Function to create a file from a URL
    createFileFromUrl: async function (path, url, callback) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function (ev) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    let data = new Uint8Array(request.response);
                    cv.FS_createDataFile('/', path, data, true, false, false);
                    callback();
                } else {
                    logOpenCVError('Failed to load ' + url + ' status: ' + request.status);
                }
            }
        };
        request.send();
    },

    // Function used to give more descriptive error messages for OpenCV errors
    logOpenCVError: function (err) {
        if (typeof err === 'undefined') {
            err = '';
        } else if (typeof err === 'number') {
            if (!isNaN(err)) {
                if (typeof cv !== 'undefined') {
                    err = 'Exception: ' + cv.exceptionFromPtr(err).msg;
                }
            }
        } else if (typeof err === 'string') {
            let ptr = Number(err.split(' ')[0]);
            if (!isNaN(ptr)) {
                if (typeof cv !== 'undefined') {
                    err = 'Exception: ' + cv.exceptionFromPtr(ptr).msg;
                }
            }
        }

        console.error(err)
    },

    // Function to display modal with message for error handling
    displayModal: function (message) {
        const modal = document.getElementById('modalPopup');
        const modalMessage = document.getElementById('modal-message');
        modalMessage.textContent = message;
        modal.style.display = "block";

        // Close modal when user clicks on close button
        const closeBtn = document.getElementsByClassName("close")[0];
        closeBtn.onclick = function () {
            modal.style.display = "none";
        }
    },

    // Function to animate and hide an element
    animateAndHide: function (element, animationClass, duration, removeClass = null) {
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
}