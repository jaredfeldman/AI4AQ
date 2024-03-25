#FLASK APP FOR AI4AQ

from flask import (
    Flask,
    render_template,
    jsonify,
    request)
import pandas as pd
import sqlite3
import traceback

## import functions
#from get_latest_sensor_test import return_table
import utils.get_summary_sensor as summary_s

app=Flask(__name__)


# Main Endpoint
@app.route("/")
def home():
    return render_template("index.html")
    
@app.route("/api/test")
def test():
    return 'test'


# Gets Average or Latest sensor plots to point
@app.route("/api/summary_sensor", methods=["GET"])
def get_latest():
    try:
        # Retrieve query parameters
        begin_date = request.args.get('begin_date')
        end_date = request.args.get('end_date')
        
        # Fetching the color states
        red = request.args.get('red') == 'true'
        orange = request.args.get('orange') == 'true'
        green = request.args.get('green') == 'true'
        lightBlue = request.args.get('lightBlue') == 'true'  # Updated to match JavaScript object key
        
        return summary_s.return_table(begin_date, end_date, red, orange, green, lightBlue).to_json(orient='records')
    except Exception as e:
        traceback_str = ''.join(traceback.format_exception(etype=type(e), value=e, tb=e.__traceback__))
        app.logger.error(f"Error: {traceback_str}")
        return jsonify({"error": "Internal Server Error"}), 500
        
# Gets Average or Latest sensor plots to point
@app.route("/api/county_avg", methods=["GET"])
def get_latest_county():
    try:
        # Retrieve query parameters
        begin_date = request.args.get('begin_date')
        end_date = request.args.get('end_date')
        
        # Fetching the color states
        red = request.args.get('red') == 'true'
        orange = request.args.get('orange') == 'true'
        green = request.args.get('green') == 'true'
        lightBlue = request.args.get('lightBlue') == 'true'  # Updated to match JavaScript object key
        
        return summary_s.return_county(begin_date, end_date, red, orange, green, lightBlue).to_json(orient='records')
    except Exception as e:
        traceback_str = ''.join(traceback.format_exception(etype=type(e), value=e, tb=e.__traceback__))
        app.logger.error(f"Error: {traceback_str}")
        return jsonify({"error": "Internal Server Error"}), 500
    
# Gets all dates and orders them for the date selection tool
@app.route("/api/date_range", methods=["GET"])
def get_date_range():

    # Pass the dates to function
    return pd.read_csv('static/data/date_range.csv').to_json(orient='records')


if __name__=="__main__":
    app.run(debug=True)
    



