from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

app.static_folder = 'static' # Set the static folder to the 'static' folder in the current directory
app.template_folder = 'templates' # Set the template folder to the 'templates' folder in the current directory

# Global variables
URL = "https://teachablemachine.withgoogle.com/models/l4Oo33mJS/"; # URL of the Teachable Machine model
# Consider using the model locally?

# Index page
@app.route('/')
def index():
    return render_template('index.html')

# Feed haarcascade_frontalface_default.xml file to the client
@app.route('/face_cascade')
def get_cascade():
    return send_from_directory('static', 'haarcascade_frontalface_default.xml')

# Page to display when content is not found
@app.errorhandler(404)
def not_found_error(error):
    return render_template('content_not_found.html', error=error), 404

if __name__ == '__main__':
    app.run(debug=True)