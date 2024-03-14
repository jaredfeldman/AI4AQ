#FLASK APP FOR AI4AQ
# I modified this from my previous project and commented out the code for reference

from flask import (
    Flask,
    render_template,
    jsonify,
    request)
import pandas as pd
import sqlite3

## import functions
#from get_latest_sensor_test import return_table
import utils.get_latest_sensor_test as test_py

app=Flask(__name__)


# Main Endpoint
@app.route("/")
def home():
    return render_template("index.html")


# Gets latest sensor plots to point - this is just a test
@app.route("/api/latest_test", methods=["GET"])
def get_latest():
    try:
        return test_py.return_table().to_json(orient='records')
    except Exception as e:
        traceback_str = ''.join(traceback.format_exception(etype=type(e), value=e, tb=e.__traceback__))
        app.logger.error(f"Error: {traceback_str}")
        return jsonify({"error": "Internal Server Error"}), 500



if __name__=="__main__":
    app.run(debug=True)


