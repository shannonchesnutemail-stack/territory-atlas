# Murray Roofing — Territory Atlas

Interactive county atlas for roofing territory planning: population, housing units,
ZIP codes, land area and density per county. Reusable across states.

**Live site:** https://shannonchesnutemail-stack.github.io/territory-atlas/

## What it does

- Click any county for its ZIP codes (Copy / CSV / Link)
- Deep link straight to a county: `#douglas`, `#sarpy`
- All 93 Nebraska counties in the reference table
- Print stylesheet built in (8.5 x 11)

## Data sources

- Population: U.S. Census Bureau Vintage 2023 county estimates
- Housing units: 2023 ACS 5-Year Estimates
- ZIP codes: Census 2020 ZCTA-to-county relationship file
- Geometry: Census cartographic boundary files

A ZIP can span counties; the share shown is the portion of that ZIP's land
area inside the county.

## Adding another state

The site reads `site-data.js` (data) plus `map.js` (geometry). To add a state,
produce those two files for the new state and swap them in.
