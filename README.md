# Murray Roofing — Territory Atlas

Storm & market intelligence for roofing territory planning. Live:
https://shannonchesnutemail-stack.github.io/territory-atlas/

## What it shows

Color the map by **Opportunity score, hail, wind, roof age, or population**.
Click any county for ZIP codes, storm history, market size and competition.

## Data sources

- **Storm history:** NOAA Storm Events database, 2015-2024 (hail + high/thunderstorm wind)
- **Housing units & median year built:** U.S. Census ACS 2023
- **Roofing contractors:** Census County Business Patterns 2022 (NAICS 238160)
- **ZIP codes:** Census 2020 ZCTA-to-county relationship file

## The Opportunity Score

A Murray-defined weighted model (1-10), not a Census or NOAA metric:

- Hail frequency 30%
- Roof age 20%
- Market size 20%
- Wind frequency 15%
- Low competition 15%

A blank roofing-contractor count means none reported or Census-suppressed.

## Adding another state

The site reads separate data and geometry files. To add a state, regenerate
`site-core.js`, `zips-1/2.js`, `wx-1/2.js` and `map-1/2.svg`; the app, CSS and
page shell are reused as-is.
