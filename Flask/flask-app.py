from flask import Flask, render_template, send_from_directory, request, abort

app = Flask(__name__)

app.static_folder = 'static' # Set the static folder to the 'static' folder in the current directory
app.template_folder = 'templates' # Set the template folder to the 'templates' folder in the current directory

# Global variables
URL = "https://teachablemachine.withgoogle.com/models/l4Oo33mJS/"; # URL of the Teachable Machine model

AUTHENTICATION_TOKEN = 'a123' # Authentication token for the user

# Authentication function - return True if the user is authorised to access the file, False otherwise
def authenticate(token):
    if token == AUTHENTICATION_TOKEN:
        return True
    else:
        return False
    
# Authenticate and send the file to the client
def authenticate_and_send_file(token, file_path):
    if authenticate(token):
        print('Authenticated, sending', file_path, 'to the client...')
        return send_from_directory('static', file_path)
    else:
        abort(403)

# Index page
@app.route('/')
def index():
    return render_template('index.html')

# Consider authentication on file access
# Feed haarcascade_frontalface_default.xml file to the client
@app.route('/face_cascade')
def get_cascade():
    return send_from_directory('static', 'cascades/haarcascade_frontalface_default.xml')

# Feed the Teachable Machine model to the client
@app.route('/model')
def get_model():
    return send_from_directory('static', 'tm-model/model.json')

# Feed the Teachable Machine metadata to the client
@app.route('/metadata')
def get_metadata():
    return send_from_directory('static', 'tm-model/metadata.json')

# Feed the Teachable Machine weights to the client
@app.route('/weights.bin')
def get_weights():
    return send_from_directory('static', 'tm-model/weights.bin')

# Feed the Teachable Machine URL to the client
@app.route('/url')
def get_url():
    if authenticate(request.headers.get('token')):
        return URL
    else:
        abort(403)

# Page to display when content is not found
@app.errorhandler(404)
def not_found_error(error):
    return render_template('content_not_found.html', error=error), 404

# Page to display when access is forbidden
@app.errorhandler(403)
def forbidden_error(error):
    return render_template('forbidden_access.html', error=error), 403

if __name__ == '__main__':
    app.run(debug=True)