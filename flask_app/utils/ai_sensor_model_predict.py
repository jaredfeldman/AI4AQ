import pandas as pd
import sqlite3
from datetime import datetime, timedelta  # Import both datetime and timedelta
from joblib import load
import numpy as np
from sklearn.neighbors import NearestNeighbors
import requests
import json

import requests
from datetime import datetime, timedelta
import pandas as pd

def wind_info(the_date):
    dfx = pd.DataFrame({'latitude': [40.6442], 'longitude': [111.9522]}, index=['Salt Lake County'])
    
    # Initialize the start date from the provided date string
    start_date = datetime.strptime(the_date, '%Y-%m-%d')
    end_date = start_date  # Same as start_date because it's daily data

    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": dfx.iloc[0].latitude,
        "longitude": dfx.iloc[0].longitude,
        "start_date": start_date.strftime('%Y-%m-%d'),
        "daily": ["wind_speed_10m_max", "wind_gusts_10m_max", "wind_direction_10m_dominant"],
        "temperature_unit": "fahrenheit",
        "wind_speed_unit": "mph",
        "timezone": "America/Denver"
    }
    
    response = requests.get(url, params=params)
    daily_data = response.json().get('daily', [])

    # Check if data is empty and return default data if so
    if not daily_data:  # if daily_data is empty or does not exist
        return {'time': [the_date], 'wind_speed_10m_max': [5.8], 'wind_gusts_10m_max': [10.3], 'wind_direction_10m_dominant': [308]}
    
    return daily_data

# Example usage
data = wind_info('2020-01-01')
print(data)

def find_nearest_sensor_pm_value(latitude, longitude, df, pm_type='pm2'):
    # Extract coordinates from the DataFrame
    coords = df[['latitude', 'longitude']].values
    
    # Create a NearestNeighbors model and fit it to the coordinates
    nbrs = NearestNeighbors(n_neighbors=4, algorithm='ball_tree').fit(coords)
    
    # Find the indices and distances of the 4 nearest neighbors (including the point itself)
    distances, indices = nbrs.kneighbors([[latitude, longitude]])
    
    # Get the indices of the three nearest neighbors (excluding the first one if it's the point itself)
    nearest_indices = indices[0][1:]  # Change this line to [0] if the point itself is not in the dataset
    
    # Retrieve the PM values of the nearest neighbors
    nearest_pm_values = df.iloc[nearest_indices][pm_type]
    
    # Calculate the average of the PM values
    average_pm_value = nearest_pm_values.mean()
    
    return average_pm_value

def pm25_predict(input_lat, input_lng, input_date, cluster_labels):
    url_base = './flask_app/static/data/'

    input_lng = round(input_lng, 5)
    input_lat = round(input_lat, 5)

    predict_input = pd.DataFrame({'longitude': [input_lng], 'latitude': [input_lat], 'date': [input_date]})

    begin_date_obj = datetime.strptime(input_date, "%Y-%m-%d")
    end_date_obj = begin_date_obj + timedelta(days=1)
    end_date = end_date_obj.strftime("%Y-%m-%d")

    connection = sqlite3.connect('./flask_app/db/sensors_readings_2016_present.db')
    sql_query = """
    SELECT sensor_id, pm2, pm10, latitude, longitude
    FROM sensors_readings
    WHERE date(date) BETWEEN ? AND ?
    AND pm2 IS NOT NULL
    AND pm10 IS NOT NULL
    
    """
    df = pd.read_sql_query(sql_query, connection, params=(input_date, end_date))
    connection.close()

    df_cat = pd.read_csv(f'{url_base}sensor_categories.csv')
    df = df.merge(df_cat, on='sensor_id')
    nearest_pm2_5_value = find_nearest_sensor_pm_value(input_lat, input_lng, df, 'pm2')
    nearest_pm10_value = find_nearest_sensor_pm_value(input_lat, input_lng, df, 'pm10')

    url = f'{url_base}centroids_merge.csv'
    temp = pd.read_csv(url)
    temp['latitude'] = temp['latitude'].round(5)
    temp['longitude'] = temp['longitude'].round(5)

    predict_input = predict_input.merge(temp, on=['latitude', 'longitude'])
    predict_input['month'] = begin_date_obj.month
    # 'county' column in predict_input for the following operations to work
    predict_input['avg_pm2'] = df.loc[df['county'] == predict_input['county'].iloc[0], 'pm2'].values[0]
    predict_input['avg_pm10'] = df.loc[df['county'] == predict_input['county'].iloc[0], 'pm10'].values[0]

    category_map = {'red': 1, 'orange': 2, 'green': 3, 'blue': 4}
    county_map = {'Salt Lake County': 1, 'Weber County': 2, 'Davis County': 3}
    predict_input['county_encoded'] = predict_input['county'].map(county_map)
    predict_input['category_encoded'] = predict_input['category'].map(category_map)

    df = predict_input[['latitude', 'longitude', 'avg_pm10', 'avg_pm2', 'county_encoded', 'category_encoded', 'month']]
    df['cluster_labels'] = cluster_labels
    df['nearest_pm2_5'] = nearest_pm2_5_value
    df['nearest_pm10'] = nearest_pm10_value
    print(input_date)
    responses = wind_info(input_date)
    # contains the expected keys before assignment
    df['wind_direction_10m_dominant'] = responses.get('wind_direction_10m_dominant', [np.nan])[0]
    df['wind_gusts_10m_max'] = responses.get('wind_gusts_10m_max', [np.nan])[0]
    df['wind_speed_10m_max'] = responses.get('wind_speed_10m_max', [np.nan])[0]
    df=df.dropna()
    preprocessor = load(f'{url_base}preprocessor.joblib')
    X_new_transformed = preprocessor.transform(df)
    scaler = load(f'{url_base}preprocessorMinMax.joblib')
    X_new_transformed = scaler.transform(X_new_transformed)
    return X_new_transformed,nearest_pm2_5_value,nearest_pm10_value
