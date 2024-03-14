import pandas as pd
import sqlite3

# Returns entire test dataset to flask

def return_table():
    #Set up sqlite
    connection = sqlite3.connect('static/data/test_sensor.db')
    
    #Assemble Query
    sql_query = "select * from latest_sensor_data"
        
    df=pd.read_sql_query(sql_query,connection)
    connection.close()
    
    return df
    



