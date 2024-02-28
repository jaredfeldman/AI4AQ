import argparse
import requests
import pandas as pd
import json

# get the credentials to access the AQS API from credentials json
with open("./src/api_credentials.json") as credentials:
    aqs_creds = json.load(credentials)["aqs_credentials"]

# assign email and pw to variables
aqs_email = aqs_creds["aqs_email"]
aqs_pw = aqs_creds["aqs_password"]

# get the GPS coordinates that were defined in coordinates.json
# specific to the sensor location outline
with open("./src/coordinates.json") as coordinates:
    sensor_coordinates = json.load(coordinates)['sensor_box']

# assign the coordinates to variables
minlat = sensor_coordinates['sensor_SElat']
maxlat = sensor_coordinates['sensor_NWlat']
minlng = sensor_coordinates['sensor_NWlng']
maxlng = sensor_coordinates['sensor_SElng']

def annual_aqs_by_box(aqs_email, aqs_pw, param_, bdate_, edate_, minlat_, maxlat_, minlng_, maxlng_):
    """
    Fetches data from the Air Quality System (AQS) API for a specified area enclosed by certain lat/long coordinate box.

    From EPA: 'Returns data summarized at the yearly level. Variables include mean value, maxima, percentiles, etc. 
    Data is at the monitor level and may include more than one entry per monitor. 
    There may be multiple entries for different (1) sample durations, (2) pollutant standards. ''

    Parameters:
    - aqs_email (str): The email associated with the AQS API key
    - aqs_pw (str): The AQS API key
    - param_ (str): The AQS parameter code for the data selection. AQS uses proprietary 5 digit codes,
                    found here: https://www.epa.gov/aqs/aqs-code-list
    - bdate_ (str): The beginning date in the format 'YYYYMMDD'
    - edate_ (str): The ending date in the format 'YYYYMMDD'
    - minlat_ (str): The minimum latitude coordinate for the box
    - maxlat_ (str): The maximum latitude coordinate for the box
    - minlng_ (str): The minimum longitude coordinate for the box
    - maxlng_ (str): The maximum longitude coordinate for the box

    Returns:
    dict: A dictionary containing the API response.
    """

    url = "https://aqs.epa.gov/data/api/annualData/byBox"

    params = {
        "email": aqs_email,
        "key": aqs_pw,
        "param": param_,
        "bdate": bdate_,
        "edate": edate_,
        "minlat": minlat_,
        "maxlat": maxlat_,
        "minlon": minlng_,
        "maxlon": maxlng_,
    }

    response = requests.get(url, params=params)

    data = response.json()

    return data

def fetch_and_combine_data(start_year, end_year, aqs_email, aqs_pw, param, minlat, maxlat, minlon, maxlon):
    """
    Fetches and combines AQS data for a specified region and time period.

    Parameters:
    - start_year (int): The start year of the data retrieval period.
    - end_year (int): The end year of the data retrieval period.
    - aqs_email (str): The email associated with the AQS API key.
    - aqs_pw (str): The AQS API key.
    - param (str): The AQS parameter code for the data selection. AQS uses proprietary 5 digit codes. They may be obtained via the list parameters service.
    - minlat (str): The minimum latitude coordinate for the region.
    - maxlat (str): The maximum latitude coordinate for the region.
    - minlng (str): The minimum longitude coordinate for the region.
    - maxlng (str): The maximum longitude coordinate for the region.

    Returns:
    pandas.DataFrame: A DataFrame containing the combined data for the specified region and time period.
    """

    all_years_data = []  # list to store data of all years

    # loop through years from start_year to end_year
    # data can only be pulled in one year increments or less,
    # so we will pull entire years
    for year in range(start_year, end_year):
        bdate_ = f'{year}0101'  # January 1st of the current year
        edate_ = f'{year}1231'  # December 31st of the current year
        
        # call the API for the current year
        year_data = annual_aqs_by_box(aqs_email, aqs_pw, param, bdate_, edate_, minlat, maxlat, minlon, maxlon)
        
        # year_data['Data'] should contain the relevant data
        # convert the data to a DataFrame
        df_year = pd.DataFrame(year_data['Data'])
            
        # append the DataFrame to the all_years_data list
        all_years_data.append(df_year)
    
    # concatenate all DataFrames into one
    combined_df = pd.concat(all_years_data, ignore_index=True)
    
    return combined_df

if __name__ == "__main__":
    # create argument parser
    parser = argparse.ArgumentParser(description='Fetch Air Quality System (AQS) data.')

    # add command-line arguments
    parser.add_argument('--start_year', type=int, help='Start year')
    parser.add_argument('--end_year', type=int, help='End year')
    parser.add_argument('--param', type=str, help='Parameter code')
    parser.add_argument('--output_file', type=str, help='Output file name')

    # parse command-line arguments
    args = parser.parse_args()

    # call fetch_and_combine_data function with provided arguments
    annual_data = fetch_and_combine_data(args.start_year, args.end_year, aqs_email, aqs_pw, args.param, minlat, maxlat, minlng, maxlng)
    
    # Save data to CSV if output_file argument is provided
    if args.output_file:
        annual_data.to_csv(args.output_file, index=False)
        print(f"Data saved to {args.output_file}")
    else:
        # If output_file argument is not provided, print the data
        print(annual_data)