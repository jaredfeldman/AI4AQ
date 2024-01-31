# Air Quality Systems (AQS)

## Files
- `aqs-start.ipynb`
    - preliminary investigation using guidance from API documentation
- `aqs-eda.ipynb`
    - EDA for data from all 11 counties surrounding the great salt lake
- `aqs-create-2023-slc-csv.ipynb`
    - Code used to create `aqs-all-slc-counties-2023.csv`
    - Could potentially be turned into script
- `aqs-all-slc-counties-2023.csv`
    - Contains data from all 11 SLC counties (counties determined visually [here](https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.mapofus.org%2Fwp-content%2Fuploads%2F2013%2F09%2FUT-county.jpg&f=1&nofb=1&ipt=90d191eac8958021174226d240b1f9164640df08745564dde1b1c9eeff5a115b&ipo=images))
    - Result of API call that took 1-3 minutes to run, can use this for EDA instead of using API call each time

## Notes
- Free to use, requires email sign up
- Can only query 1 year of data (MUST be within the same year), and data is up to 6 months old
- Can be used to pull daily readings from outdoor monitors
- **Parameters**
    - The `param` parameter in the API call can take up to 5 parameters. This is where we identify pollutants, PM, etc.
    - There are A LOT - full list: https://aqs.epa.gov/aqsweb/documents/codetables/methods_all.html
    - S

## TO DO
- Determine parameters that we'll need to pass into `param`

## EDA Findings
- Of the 11 counties around the great salt lake, only 7 have 2023 data for param 88101
    1. Salt Lake
    2. Utah
    3. Cache
    4. Davis
    5. Wber
    6. Tooele
    7. Box Elder
- There are only 14 unique `site_number`s
- Each observation is taken every hour, on the hour
- `qualifier`
    - some data may be unusable from this column - may need to filter here
- Across these 7 sites, there are 153,834 total observations
