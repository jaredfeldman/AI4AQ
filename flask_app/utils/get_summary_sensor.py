import pandas as pd
import sqlite3
from datetime import datetime, timedelta

def return_table(begin_date, end_date,red,orange,green,lightBlue,salt,web,dav,r0,r1,r2,o0,o1,o2,b0,b1,b2,g0,g1,g2):


    # Convert strings to datetime objects
    begin_date_obj = datetime.strptime(begin_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

    # Check if dates are the same
    if begin_date_obj == end_date_obj:
        # Move end_date forward by one day
        end_date_obj += timedelta(days=1)

        # Convert back to string
        end_date = end_date_obj.strftime("%Y-%m-%d")

    
    
    # Set up sqlite
    connection = sqlite3.connect('static/data/sensors_readings_2016_present.db')
    
    # Assemble Query
    sql_query = """
    SELECT sensor_id, latitude, longitude, altitude, AVG(pm2) AS avg_pm2, AVG(pm10) AS avg_pm10
    FROM sensors_readings
    WHERE date(date) BETWEEN ? AND ?
    AND pm2 IS NOT NULL
    AND pm10 IS NOT NULL
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
    # Step 1: Calculate Sums and Counts
    sums = df.groupby('category').sum().reset_index()
    counts = df.groupby('category').count().reset_index().rename(columns={'avg_pm2': 'count', 'avg_pm10': 'drop'}).drop('drop', axis=1)

    # Add the external counts and sums
    if r0 != 0:
        sums.loc[sums['category'] == 'red', 'avg_pm2'] += r1
        sums.loc[sums['category'] == 'red', 'avg_pm10'] += r2
        counts.loc[counts['category'] == 'red', 'count'] += r0
    if o0 != 0:
        sums.loc[sums['category'] == 'orange', 'avg_pm2'] += o1
        sums.loc[sums['category'] == 'orange', 'avg_pm10'] += o2
        counts.loc[counts['category'] == 'orange', 'count'] += o0
        
    if b0 != 0:
        sums.loc[sums['category'] == 'blue', 'avg_pm2'] += b1
        sums.loc[sums['category'] == 'blue', 'avg_pm10'] += b2
        counts.loc[counts['category'] == 'blue', 'count'] += b0
        
    if g0 != 0:
        sums.loc[sums['category'] == 'green', 'avg_pm2'] += g1
        sums.loc[sums['category'] == 'green', 'avg_pm10'] += g2
        counts.loc[counts['category'] == 'green', 'count'] += g0
    

    # Step 3: Calculate Averages
    averages = sums.copy()
    averages['cat_avg_pm2'] = round(sums['avg_pm2'] / counts['count']).astype('int')
    averages['cat_avg_pm10'] = round(sums['avg_pm10'] / counts['count']).astype('int')

    averages = averages[['category', 'cat_avg_pm2', 'cat_avg_pm10']]
    
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
    
    
def return_county(begin_date, end_date,red,orange,green,lightBlue,salt,web,dav,s0,s1,s2,w0,w1,w2,d0,d1,d2):


    # Convert strings to datetime objects
    begin_date_obj = datetime.strptime(begin_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

    # Check if dates are the same
    if begin_date_obj == end_date_obj:
        # Move end_date forward by one day
        end_date_obj += timedelta(days=1)

        # Convert back to string
        end_date = end_date_obj.strftime("%Y-%m-%d")

    # Set up sqlite
    connection = sqlite3.connect('static/data/sensors_readings_2016_present.db')
    
    # Assemble Query
    sql_query = """
    SELECT sensor_id, latitude, longitude, altitude, AVG(pm2) AS avg_pm2, AVG(pm10) AS avg_pm10
    FROM sensors_readings
    WHERE date(date) BETWEEN ? AND ?
    AND pm2 IS NOT NULL
    AND pm10 IS NOT NULL
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
    # Step 1: Calculate Sums and Counts
    sums = df.groupby('county').sum().reset_index()
    counts = df.groupby('county').count().reset_index().rename(columns={'avg_pm2': 'count', 'avg_pm10': 'drop'}).drop('drop', axis=1)

    # Add the external counts and sums
    if s0 != 0:
        sums.loc[sums['county'] == 'Salt Lake County', 'avg_pm2'] += s1
        sums.loc[sums['county'] == 'Salt Lake County', 'avg_pm10'] += s2
        counts.loc[counts['county'] == 'Salt Lake County', 'count'] += s0
    
    if w0 != 0:
        sums.loc[sums['county'] == 'Weber County', 'avg_pm2'] += w1
        sums.loc[sums['county'] == 'Weber County', 'avg_pm10'] += w2
        counts.loc[counts['county'] == 'Weber County', 'count'] += w0

    if d0 != 0:
        sums.loc[sums['county'] == 'Davis County', 'avg_pm2'] += d1
        sums.loc[sums['county'] == 'Davis County', 'avg_pm10'] += d2
        counts.loc[counts['county'] == 'Davis County', 'count'] += d0

    # Step 3: Calculate Averages
    averages = sums.copy()
    averages['cat_avg_pm2'] = round(sums['avg_pm2'] / counts['count']).astype('int')
    averages['cat_avg_pm10'] = round(sums['avg_pm10'] / counts['count']).astype('int')

    averages = averages[['county', 'cat_avg_pm2', 'cat_avg_pm10']]
    
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
    

# This will be for linear graph data
def sensor_linear(begin_date,end_date,red,orange,green,lightBlue,salt,web,dav):

    # Convert strings to datetime objects
    begin_date_obj = datetime.strptime(begin_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

    # Check if dates are the same
    if begin_date_obj == end_date_obj:
        # Move end_date forward by one day
        begin_date_obj += timedelta(days=-92)

        # Convert back to string
        begin_date = begin_date_obj.strftime("%Y-%m-%d")

    # Set up sqlite
    connection = sqlite3.connect('static/data/sensors_readings_2016_present.db')
    
    # Assemble Query
    sql_query = """
    SELECT sensor_id,latitude, longitude, altitude, pm2, pm10, date(date) as date
    FROM sensors_readings
    WHERE date(date) BETWEEN ? AND ?
    AND pm2 IS NOT NULL
    AND pm10 IS NOT NULL

    """
    
    # Execute the query
    df = pd.read_sql_query(sql_query, connection, params=(begin_date, end_date))
    df = df.dropna()
#     # Join with color categories
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
    # Step 1: Calculate Sums and Counts

    selected_counties =[]
    if salt == True:
        selected_counties.append('Salt Lake County')
    if web == True:
        selected_counties.append('Weber County')
    if dav == True:
        selected_counties.append('Davis County')
                 
    
    df = df.loc[df['county'].isin(selected_counties)]
    df = pd.merge(df,df_color, on = ['sensor_id','county'])
    df= df[['pm2','pm10','county','date']].groupby(['county','date']).mean()
    
    connection.close()
    return df.reset_index()
    

    # This will be for linear graph data
def sensor_linear_category(begin_date,end_date,red,orange,green,lightBlue,salt,web,dav):

    # Convert strings to datetime objects
    begin_date_obj = datetime.strptime(begin_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

    # Check if dates are the same
    if begin_date_obj == end_date_obj:
        # Move end_date forward by one day
        begin_date_obj += timedelta(days=-92)
        
    begin_date = begin_date_obj.strftime("%Y-%m-%d")
    
    # Set up sqlite
    connection = sqlite3.connect('static/data/sensors_readings_2016_present.db')
    
    # Assemble Query
    sql_query = """
    SELECT sensor_id,latitude, longitude, altitude, pm2, pm10, date(date) as date
    FROM sensors_readings
    WHERE date(date) BETWEEN ? AND ?
    AND pm2 IS NOT NULL
    AND pm10 IS NOT NULL

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
    df= df[['pm2','pm10','category','date']].groupby(['category','date']).mean()
    
    connection.close()
    return df.reset_index()
