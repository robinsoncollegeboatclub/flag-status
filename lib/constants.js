// units/params in the Met Office DataPoint API are:
const params = {
    "Feels Like Temperature": "F",
    "Wind Gust": "G", // given in mph
    "Screen Relative Humidity": "H",
    "Temperature": "T",
    "Visibility": "V",
    "Wind Direction": "D", // wind direction
    "Wind Speed": "S", // given in mph
    "Max UV Index": "U",
    "Weather Type": "W",
    "Precipitation Probability": "Pp",
    "Timestamp": "$", // given in minutes after midnight UTC on the date in question
};

const weatherStatusCodes = {
    "NA": "Not available",
    "0": "Clear night",
    "1": "Sunny day",
    "2": "Partly cloudy (night)",
    "3": "Partly cloudy (day)",
    "4": "Not used",
    "5": "Mist",
    "6": "Fog",
    "7": "Cloudy",
    "8": "Overcast",
    "9": "Light rain shower (night)",
    "10": "Light rain shower (day)",
    "11": "Drizzle",
    "12": "Light rain",
    "13": "Heavy rain shower (night)",
    "14": "Heavy rain shower (day)",
    "15": "Heavy rain",
    "16": "Sleet shower (night)",
    "17": "Sleet shower (day)",
    "18": "Sleet",
    "19": "Hail shower (night)",
    "20": "Hail shower (day)",
    "21": "Hail",
    "22": "Light snow shower (night)",
    "23": "Light snow shower (day)",
    "24": "Light snow",
    "25": "Heavy snow shower (night)",
    "26": "Heavy snow shower (day)",
    "27": "Heavy snow",
    "28": "Thunder shower (night)",
    "29": "Thunder shower (day)",
    "30": "Thunder",
};

const visibilityStatusCodes = {
    "UN": "Unknown",
    "VP": "Very poor - Less than 1 km",
    "PO": "Poor - Between 1-4 km",
    "MO": "Moderate - Between 4-10 km",
    "GO": "Good - Between 10-20 km",
    "VG": "Very good - Between 20-40 km",
    "EX": "Excellent - More than 40 km",
};

const windDirections = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
];

// create a map that maps url to flag status
const flagStatusMap = {
    "/misc/flag/grn.png": "Green",
    "/misc/flag/yel.png": "Yellow",
    "/misc/flag/ryl.png": "Red/Yellow",
    "/misc/flag/red.png": "Red",
    "/misc/flag/nop.png": "Not Operational",
};

module.exports = {
    params,
    weatherStatusCodes,
    visibilityStatusCodes,
    windDirections,
    flagStatusMap,
};
