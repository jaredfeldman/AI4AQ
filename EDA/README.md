# EDA

## Datasets
### PurpleAir
### Notebooks:
- `purple-air-api-tutorial.ipynb`
    - Attempt at tutorial [here](https://community.purpleair.com/t/making-api-calls-with-the-purpleair-api/180), but attempt to add sensors to group hung for several minutes and never processed
- `purple-air-eda.ipynb`
    - When failures reaches above, attempt at pulling SLC sensors without a group, using long/lat from code [here](https://community.purpleair.com/t/aqi-location-bound-list-of-sensors-limited/3343)
#### Notes
- API calls cost points. Each newly created Organization starts out with 1,000,000 points, which must be assigned to individual projects.
    - Costs:
        - READ data from 1 sensor: 135 points for ALL fields
        - WRITE create group: 1 point
            - NOTE: If run multiple times, multiple groups will be created with the same name but different IDs
        - READ get group information: 10 points
            - Jot down ID immediately after group creation to avoid using points here
    - Pricing
        - Base is $1 = 100,000 points, but more points can be acquired per $1 based on the purchase amount (e.g., if you purchase $100 worth of points, $1 = 150,000 points)
- To query multiple sensors at once, we must create groups and assign it a name. Groups are given unique IDs and assigned to the API keys that they are created with.
#### Maximizing Points for AI4AQ
- TO DO: Create documentation for streamlined API call to minimize points used for one person to pull data we need
#### EDA Findings