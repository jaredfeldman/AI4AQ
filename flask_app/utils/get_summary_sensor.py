import pandas as pd
import sqlite3


def return_table(begin_date, end_date,red,orange,green,lightBlue,salt,web,dav):
    # Set up sqlite
    connection = sqlite3.connect('static/data/sensors_readings_2016_present.db')
    
    # Assemble Query
    sql_query = """
    SELECT sensor_id, latitude, longitude, altitude, AVG(pm2) AS avg_pm2, AVG(pm10) AS avg_pm10
    FROM sensors_readings
    WHERE date(date) BETWEEN ? AND ?
    GROUP BY sensor_id, latitude, longitude, altitude
    """
    
    # Execute the query
    df = pd.read_sql_query(sql_query, connection, params=(begin_date, end_date))
    
    # Join with color categories
    df_color = pd.read_csv('static/data/sensor_categories.csv')
    df = pd.merge(df,df_color, on = 'sensor_id')
    
    selected_counties =[]
    if salt == True:
        selected_counties.append('Salt Lake County')
    if web == True:
        selected_counties.append('Weber County')
    if dav == True:
        selected_counties.append('Davis County')
    
    df = df.loc[df['county'].isin(selected_counties)]
    
    df.drop(['county'], axis=1, inplace=True)
    # Get category averages
    averages = df.groupby('category').mean().reset_index()
    averages = averages[['category','avg_pm2','avg_pm10']]
    averages.rename(columns = {'avg_pm2':'cat_avg_pm2','avg_pm10':'cat_avg_pm10'}, inplace = True)
    averages['cat_avg_pm2'] = round(averages['cat_avg_pm2']).astype('int')
    averages['cat_avg_pm10'] = round(averages['cat_avg_pm10']).astype('int')
    
    # Join
    
    df['avg_pm2'] = round(df['avg_pm2']).astype('int')
    df['avg_pm10'] = round(df['avg_pm10']).astype('int')

    df = pd.merge(df,averages, on = 'category')
    
    selected_colors =[]
    if red == True:
        selected_colors.append('red')
    if orange == True:
        selected_colors.append('orange')
    if green == True:
        selected_colors.append('green')
    if lightBlue == True:
        selected_colors.append('blue')
    
    df_income_colors = df.loc[df['category'].isin(selected_colors)]
    df = pd.merge(df_income_colors,df_color, on = ['sensor_id','category'])
    
    connection.close()
    return df
    
    
def return_county(begin_date, end_date,red,orange,green,lightBlue,salt,web,dav):
    # Set up sqlite
    connection = sqlite3.connect('static/data/sensors_readings_2016_present.db')
    
    # Assemble Query
    sql_query = """
    SELECT sensor_id, latitude, longitude, altitude, AVG(pm2) AS avg_pm2, AVG(pm10) AS avg_pm10
    FROM sensors_readings
    WHERE date(date) BETWEEN ? AND ?
    GROUP BY sensor_id, latitude, longitude, altitude
    """
    
    # Execute the query
    df = pd.read_sql_query(sql_query, connection, params=(begin_date, end_date))
    
    # Join with color categories
    df_color = pd.read_csv('static/data/sensor_categories.csv')
    df = pd.merge(df,df_color, on = 'sensor_id')
    
    selected_colors =[]
    if red == True:
        selected_colors.append('red')
    if orange == True:
        selected_colors.append('orange')
    if green == True:
        selected_colors.append('green')
    if lightBlue == True:
        selected_colors.append('blue')
    
    df = df.loc[df['category'].isin(selected_colors)].reset_index()
    
    df.drop(['category'], axis=1, inplace=True)
    # Get category averages
    averages = df.groupby('county').mean().reset_index()
    averages = averages[['county','avg_pm2','avg_pm10']]
    averages.rename(columns = {'avg_pm2':'cat_avg_pm2','avg_pm10':'cat_avg_pm10'}, inplace = True)
    averages['cat_avg_pm2'] = round(averages['cat_avg_pm2']).astype('int')
    averages['cat_avg_pm10'] = round(averages['cat_avg_pm10']).astype('int')
    
    # Join
    
    df['avg_pm2'] = round(df['avg_pm2']).astype('int')
    df['avg_pm10'] = round(df['avg_pm10']).astype('int')

    df = pd.merge(df,averages, on = 'county')
         
    
    selected_counties =[]
    if salt == True:
        selected_counties.append('Salt Lake County')
    if web == True:
        selected_counties.append('Weber County')
    if dav == True:
        selected_counties.append('Davis County')
                 
    
    df = df.loc[df['county'].isin(selected_counties)]
    df = pd.merge(df,df_color, on = ['sensor_id','county'])
    
    
    connection.close()
    return df
    

def sensor_linear(begin_date,end_date, the_sensor):
    connection = sqlite3.connect('static/data/sensors_readings_2016_present.db')
    
    # Assemble Query
    sql_query = """
    SELECT pm2
    FROM sensors_readings
    where (date(date) between ? and ?) and (sensor_id = ?)
    """
    
    #df = pd.read_sql_query(sql_query, connection, params=(begin_date, end_date))
    df = pd.read_sql_query(sql_query, connection, params=(begin_date,end_date,the_sensor))
    connection.close()
    
    return df

    



