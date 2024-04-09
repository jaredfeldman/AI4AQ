# Use an official Python runtime as a parent image
FROM python:3.9

# Set the working directory in the container
WORKDIR /app

# Copy the application code and requirements.txt into the container
COPY flask_app/static/ /app/flask_app/static/
COPY flask_app/templates/ /app/flask_app/templates/
COPY flask_app/utils/ /app/flask_app/utils/
COPY flask_app/app.py /app/flask_app/app.py
COPY requirements.txt .

# Install dependencies needed for the  application
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 5000, the default Flask port
EXPOSE 5000/tcp

# Define command to run the application
# NOTE: `flask run` is not needed
CMD [ "python", "flask_app/app.py" ]
