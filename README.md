# AI4AQ

## Datasets

### PurpleAir
- **Description**: The vast PurpleAir low-cost sensor network (www.purpleair.com/, PurpleAir 2021) provides an opportunity to evaluate the influence of smoke on indoor air quality over a significantly larger set of indoor environments than many previous studies. The network provides real-time measurements of indoor or outdoor PM2.5 concentrations from over 20 000 monitors across the globe.
- **Source**: API
- **API Instructions**
    1. Navigate here: https://develop.purpleair.com/keys
    2. Log in with a Google account
    3. Create a READ key and a WRITE key
- **Documentation**:
    - Main: https://api.purpleair.com/#api-welcome
    - Tutorial: https://community.purpleair.com/t/making-api-calls-with-the-purpleair-api/180

### Air Quality Systems (AQS)
- **Description**: AQS is an EPA dataset that contains ambient air sample data collected by state, local, tribal, and federal air pollution control agencies from thousands of monitors around the nation. It also contains meteorological data, descriptive information about each monitoring station (including its geographic location and its operator), and information about the quality of the samples. 
    - NOTE:AQS does not contain real-time air quality data (it can take 6 months or more from the time data is collected until it is in AQS).
- **Source**: API
- **API Instructions**:
    1. Use requires an account using your email
    2. Choose an email
    3. Navigate to https://aqs.epa.gov/data/api/signup?email=myemail@example.com, replacing `myemail@example.com` with the email you want to use
    4. An email will be sent to you from `aqsdatamart@epa.gov` containing a password
    5. Store your email and password somewhere accessible, both are required for any API call
**Documentation**:
    - Main: https://aqs.epa.gov/aqsweb/documents/data_api.html

### AirNow
- **Description**: The U.S. EPA AirNow program (www.AirNow.gov) protects public health by providing forecast and real-time observed air quality information across the United States, Canada, and Mexico. AirNow receives real-time air quality observations from over 2,000 monitoring stations and collects forecasts for more than 300 cities. 
- **Source**: API
- **API Instructions**:
    1. Navigate here: https://docs.airnowapi.org/login
    2. Click "Request an AirNow API Account"
    3. Enter the required information
    4. An email will be sent to you from `dms@airnowtech.org`
    5. Click the activation link in the email
**Documentation**:
    - Main: https://docs.airnowapi.org/