import argparse
import json
import pandas as pd
import requests

def pull_current_outdoor_purpleair_sensor_data(fields):
    """
    Retrieve the latest sensor data from the PurpleAir API for multiple sensors.

    Args:
    - fields (list of str): A list of fields to retrieve for each sensor.

    Returns:
    - Pandas dataframe: Datafrane containing the specified fields for each sensor.
    """

    # pull in the outdoor sensors from .json file
    with open("./src/purpleair_parameters.json") as outdoor_sensors:
        outdoor_sensor_list = json.load(outdoor_sensors)["outdoor_sensor_list"]

    # get the read key from .json file
    with open("./src/api_credentials.json") as f:
        purple_air_creds = json.load(f)["purple_air_credentials"]
    # store it in a variable
    api_read_key = purple_air_creds["purple_air_read_key"]
    
    # join the list of fields into a comma-separated string,
    # which is the required input for the API call
    fields_str = ",".join(fields)

    # initiate empty list to hold data for all sensor_ids identified
    list_of_sensor_data = []
    
    for sensor_id in outdoor_sensor_list:
        # construct the URL for the API request
        url = f"https://api.purpleair.com/v1/sensors/{sensor_id}"
        
        # set the query parameters for the request  
        params = {
            "fields": fields_str
        }

        # set the headers including the API key
        headers = {
            "X-API-Key": api_read_key
        }

        # send the GET request to the PurpleAir API
        sensor_response = requests.get(url, params=params, headers=headers)

        # parse the JSON response
        sensor_response_json = sensor_response.json()

        # extract the sensor data from the response
        sensor_data = sensor_response_json.get('sensor')

        # append to the list
        list_of_sensor_data.append(sensor_data)

    # convert the list to a dataframe
    current_sensor_data_df = pd.DataFrame(list_of_sensor_data)

    # return the dataframe
    return current_sensor_data_df

def main():
    # create argument parser
    parser = argparse.ArgumentParser(description='Fetch sensor data from PurpleAir API.')

    # add command-line arguments
    parser.add_argument('--fields', nargs='+', help='List of fields to retrieve for each sensor')
    parser.add_argument('--output_file', type=str, help='Output file name')

    # parse command-line arguments
    args = parser.parse_args()

    # call pull_current_outdoor_purpleair_sensor_data function with provided arguments
    sensor_data = pull_current_outdoor_purpleair_sensor_data(args.fields)

    # save data to CSV if output_file argument is provided
    if args.output_file:
        sensor_data.to_csv(args.output_file, index=False)
        print(f"Data saved to {args.output_file}")
    else:
        print(sensor_data)

if __name__ == "__main__":
    main()