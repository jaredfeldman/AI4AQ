import pandas as pd
import sqlite3


def return_table(begin_date, end_date):
    # Set up sqlite
    connection = sqlite3.connect('static/data/sensors_readings_2016_present.db')
    
    # Assemble Query
    sql_query = """
    SELECT sensor_id, latitude, longitude, altitude, AVG(pm2) AS avg_pm2, AVG(pm10) AS avg_pm10
    FROM sensors_readings
    WHERE date(date) BETWEEN ? AND ?
    GROUP BY sensor_id, latitude, longitude, altitude
    """
    
    # Execute the query with parameter substitution to prevent SQL injection
    df = pd.read_sql_query(sql_query, connection, params=(begin_date, end_date))
    
    connection.close()
    return df
    



