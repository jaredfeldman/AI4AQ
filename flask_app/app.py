#FLASK APP FOR AI4AQ

from flask import (
    Flask,
    render_template,
    jsonify,
    request)
import pandas as pd
import sqlite3
import traceback
from tensorflow.keras.models import load_model
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from joblib import load



## import functions
#from get_latest_sensor_test import return_table
import utils.get_summary_sensor as summary_s
import utils.ai_sensor_model_predict as ai_sensor



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
        lightBlue = request.args.get('lightBlue') == 'true'
        
        # Fetching the county
        salt = request.args.get('salt') == 'true'
        web = request.args.get('web') == 'true'
        dav = request.args.get('dav') == 'true'
        
        r0 = float(request.args.get('r0'))
        r1 = float(request.args.get('r1'))
        r2 = float(request.args.get('r2'))
        o0 = float(request.args.get('o0'))
        o1 = float(request.args.get('o1'))
        o2 = float(request.args.get('o2'))
        b0 = float(request.args.get('b0'))
        b1 = float(request.args.get('b1'))
        b2 = float(request.args.get('b2'))
        g0 = float(request.args.get('g0'))
        g1 = float(request.args.get('g1'))
        g2 = float(request.args.get('g2'))
        
        return summary_s.return_table(begin_date, end_date, red, orange, green, lightBlue,salt,web,dav,r0,r1,r2,o0,o1,o2,b0,b1,b2,g0,g1,g2).to_json(orient='records')
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
        lightBlue = request.args.get('lightBlue') == 'true'
        # Fetching the county
        salt = request.args.get('salt') == 'true'
        web = request.args.get('web') == 'true'
        dav = request.args.get('dav') == 'true'
        # Fetch County Counts
        s0 = float(request.args.get('s0'))
        s1 = float(request.args.get('s1'))
        s2 = float(request.args.get('s2'))
        w0 = float(request.args.get('w0'))
        w1 = float(request.args.get('w1'))
        w2 = float(request.args.get('w2'))
        d0 = float(request.args.get('d0'))
        d1 = float(request.args.get('d1'))
        d2 = float(request.args.get('d2'))
        
        #return s0
        return summary_s.return_county(begin_date, end_date, red, orange, green, lightBlue,salt,web,dav,s0,s1,s2,w0,w1,w2,d0,d1,d2).to_json(orient='records')
    except Exception as e:
        traceback_str = ''.join(traceback.format_exception(etype=type(e), value=e, tb=e.__traceback__))
        app.logger.error(f"Error: {traceback_str}")
        return jsonify({"error": "Internal Server Error"}), 500
        
@app.route("/api/sensor_linear", methods=["GET"])
def get_sensor_linear():
    try:
        # Retrieve query parameters
        begin_date = request.args.get('begin_date')
        end_date = request.args.get('end_date')
        
        # Fetching the color states
        red = request.args.get('red') == 'true'
        orange = request.args.get('orange') == 'true'
        green = request.args.get('green') == 'true'
        lightBlue = request.args.get('lightBlue') == 'true'
        
        # Fetching the county
        salt = request.args.get('salt') == 'true'
        web = request.args.get('web') == 'true'
        dav = request.args.get('dav') == 'true'
        
        
        return summary_s.sensor_linear(begin_date, end_date, red, orange, green, lightBlue,salt,web,dav).to_json(orient='records')
    except Exception as e:
        traceback_str = ''.join(traceback.format_exception(etype=type(e), value=e, tb=e.__traceback__))
        app.logger.error(f"Error: {traceback_str}")
        return jsonify({"error": "Internal Server Error"}), 500
        
@app.route("/api/sensor_linear_cat", methods=["GET"])
def get_sensor_linear_cat():
    try:
        # Retrieve query parameters
        begin_date = request.args.get('begin_date')
        end_date = request.args.get('end_date')
        
        # Fetching the color states
        red = request.args.get('red') == 'true'
        orange = request.args.get('orange') == 'true'
        green = request.args.get('green') == 'true'
        lightBlue = request.args.get('lightBlue') == 'true'
        
        # Fetching the county
        salt = request.args.get('salt') == 'true'
        web = request.args.get('web') == 'true'
        dav = request.args.get('dav') == 'true'
        
        
        return summary_s.sensor_linear_category(begin_date, end_date, red, orange, green, lightBlue,salt,web,dav).to_json(orient='records')
    except Exception as e:
        traceback_str = ''.join(traceback.format_exception(etype=type(e), value=e, tb=e.__traceback__))
        app.logger.error(f"Error: {traceback_str}")
        return jsonify({"error": "Internal Server Error"}), 500
    
# Gets all dates and orders them for the date selection tool
@app.route("/api/date_range", methods=["GET"])
def get_date_range():

    url_base = 'static/data/'
    connection = sqlite3.connect(f'{url_base}sensors_readings_2016_present.db')
    sql_query = """
    SELECT date(date) as date
    FROM sensors_readings
    order by date(date)asc
    """
    df = pd.read_sql_query(sql_query, connection)
    connection.close()

    # Pass the dates to function
    return df.to_json(orient='records')
    


# Load Model
model_pm25 = load_model('static/data/nnn_model_1_pm_25wind_image.h5')
model_pm10 = load_model('static/data/nnn_model_1_pm_10wind_image.h5')


@app.route("/api/predict", methods=["GET"])
def predict_AQ():
    try:
        # Retrieve values from request and convert them to float
        #pm2 = float(request.args.get("avgPM2"))
        #pm10 = float(request.args.get("avgPM10"))
        lat = float(request.args.get("lat"))
        lng = float(request.args.get("lng"))
        the_date = request.args.get("theDate")
        cluster_labels = request.args.get("mapCat")
        
        tensor, adjust25,adjust10 = ai_sensor.pm25_predict(lat, lng, the_date,cluster_labels)
#
        Xpm25 = model_pm25.predict(tensor)
        Xpm25 = np.round(((np.expm1(Xpm25)[0])+adjust25)/2)

        Xpm10 = model_pm25.predict(tensor)
        Xpm10 = np.round(((np.expm1(Xpm10)[0])+adjust10)/2)
        
#        # Ensure the input_value is shaped correctly
        input_value = np.array([[Xpm25], [Xpm10]])  # Shape (1, 2)
##
        prediction = input_value.flatten().tolist()  # Flatten and convert to list

        return jsonify(prediction)
        #return jsonify(prediction)
    except Exception as e:
        return jsonify({"error": str(e)}), 500




if __name__=="__main__":
    app.run(debug=True)
    



