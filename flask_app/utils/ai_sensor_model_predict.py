


from tensorflow.keras.models import load_model
import pandas as pd
import sqlite3
from datetime import datetime, timedelta
from joblib import load
import numpy as np


def pm25_predict(input_lat,input_lng,input_date):
    
    url_base ='static/data/'

    # Load Model
    model = load_model(f'{url_base}nnn_model_1.h5')

    #input_lng = -111.88080951152304
    #input_lat = 41.08032456289652
    #input_date = '2020-11-18'
    
    input_lng = round(input_lng,5)
    input_lat = round(input_lat,5)
    
    predict_input = pd.DataFrame({'longitude':input_lng,'latitude':input_lat,'date':input_date}, index = [0])


    # Convert strings to datetime objects
    begin_date_obj = datetime.strptime(input_date, "%Y-%m-%d")
    end_date_obj = begin_date_obj + timedelta(days=1)

    # Convert back to string
    end_date = end_date_obj.strftime("%Y-%m-%d")

    # Set up sqlite
    connection = sqlite3.connect(f'{url_base}sensors_readings_2016_present.db')

    # Assemble Query
    sql_query = """
    SELECT sensor_id, pm2, pm10
    FROM sensors_readings
    WHERE date(date) BETWEEN ? AND ?
    """

    # Execute the query
    df = pd.read_sql_query(sql_query, connection, params=(input_date, end_date))

    connection.close()

    # merge with sensor cateogires
    df_cat = pd.read_csv(f'{url_base}sensor_categories.csv')
    df = df.merge(df_cat, on = 'sensor_id')
    df.head()

    df = df[['county','pm2','pm10']]
    df = df.groupby('county').mean()
    df.reset_index(inplace = True)


    url = f'{url_base}centroids_merge.csv'
    temp = pd.read_csv(url)
    temp['latitude'] = temp['latitude'].round(5)
    temp['longitude'] = temp['longitude'].round(5)
    
    
    predict_input = predict_input.merge(temp, on = ['latitude','longitude'])
    predict_input['month'] = begin_date_obj.month
    predict_input['avg_pm2'] = df.loc[df.county == predict_input.county[0]].pm2.values[0]
    predict_input['avg_pm10'] = df.loc[df.county == predict_input.county[0]].pm10.values[0]

    category_map = {'red':1,'orange':2,'green':3,'blue':4}
    county_map = {'Salt Lake County':1,'Weber County':2,'Davis County':3}
    df = predict_input
    df['county_encoded'] = df['county'].map(county_map)
    df['category_encoded'] = df['category'].map(category_map)
    #df['avg_pm10'] = 20
    #df['avg_pm2'] = 20
    #df['county_encoded']=1
    df = df[['latitude','longitude', 'avg_pm10','avg_pm2','county_encoded','category_encoded','month']]

#    Load the preprocessor
    preprocessor = load(f'{url_base}preprocessor.joblib')

#   transform new data using the loaded preprocessor
    X_new_transformed = preprocessor.transform(df)

    #prediction = model.predict(X_new_transformed)

    return X_new_transformed





