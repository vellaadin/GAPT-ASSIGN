from flask import Flask, render_template

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

# Page to display when content is not found
@app.errorhandler(404)
def not_found_error(error):
    return render_template('content_not_found.html'), 404

if __name__ == '__main__':
    app.run(debug=True)