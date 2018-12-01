const AWS = require('aws-sdk');
const cheerio = require("cheerio");
const _ = require("lodash");
const moment = require("moment");
const rp = require("request-promise");
const uuid = require("uuid");

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const {
    params,
    weatherStatusCodes,
    visibilityStatusCodes,
    windDirections,
    flagStatusMap,
} = require("../lib/constants");

module.exports = (event, context, callback) => {
    console.log("Crawling Met Office and CUCBC for weather and flag status...");
    console.log();

    // define a function to get the closest index in an array to some query value
    function getClosestIndex(list, query) {
        // default to the first element in the array
        let current = 0;

        // we can skip the first index
        for (let i = 1; i < list.length; i++) {
            if (Math.abs(list[i] - query) < Math.abs(list[current] - query)) {
                current = i;
            }
        }

        return current;
    }

    // this gets the weather forecast for Cambridge on a 3-hourly basis
    const weatherPromise = rp(`http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/${process.env.LOCATION_ID}?res=3hourly&key=${process.env.MET_OFFICE_KEY}`)
        .then((json) => {
            // find the correct day's forecast in the returned data
            const data = JSON.parse(json);
            
            if (data.SiteRep.DV.type === "Forecast") {
                const forecast = data.SiteRep.DV.Location;
                const now = moment();
                
                for (const period of forecast.Period) {
                    if (moment(period.value, "YYYY-MM-DD[Z]").isSame(now, "day")) {
                        return period;
                    }
                }
            }
        })
        .then((day) => {
            // find the relevant forecast object in the rep array
            if (day.type === "Day") {
                const rep = day.Rep;
                const now = moment();

                // construct an array of the minute counts since midnight
                const minuteCounts = rep.map((r) => parseInt(r.$, 10));

                // find the current minute count since midnight today
                const startOfDay = moment(now).startOf("day");
                const currentMinuteCount = moment(now).diff(startOfDay, "minutes");
                const repIndex = getClosestIndex(minuteCounts, currentMinuteCount);

                // get the relevant forecast object
                const forecast = rep[repIndex];
                return forecast;
            }
        })
        .then((forecast) => {
            // map the MetOffice forecast representation into a human readable format
            if (forecast) {
                const forecastMap = {
                    "Wind Speed": parseInt(forecast[params["Wind Speed"]], 10),
                    "Wind Gust": parseInt(forecast[params["Wind Gust"]], 10),
                    "Current Outlook": weatherStatusCodes[forecast[params["Weather Type"]]],
                    "Current Outlook Index": forecast[params["Weather Type"]] === "NA" ? null : parseInt(forecast[params["Weather Type"]], 10),
                    "Visibility": visibilityStatusCodes[forecast[params["Visibility"]]],
                    "Visibility Index": Object.keys(visibilityStatusCodes).indexOf(forecast[params["Visibility"]]),
                    "Temperature": parseInt(forecast[params["Temperature"]], 10),
                    "Feels Like Temperature": parseInt(forecast[params["Feels Like Temperature"]], 10),
                    "Precipitation Probability": parseInt(forecast[params["Precipitation Probability"]], 10),
                    "Wind Direction": forecast[params["Wind Direction"]],
                    "Wind Direction Index": windDirections.indexOf(forecast[params["Wind Direction"]]),
                };

                console.log("Current Forecast:");
                console.log(`Wind Speed: ${forecastMap["Wind Speed"]} mph`);
                console.log(`Wind Gust: ${forecastMap["Wind Gust"]} mph`);
                console.log(`Current Outlook: ${forecastMap["Current Outlook"]}`);
                console.log(`Current Outlook Index: ${forecastMap["Current Outlook Index"]}`)
                console.log(`Visibility: ${forecastMap["Visibility"]}`);
                console.log(`Visibility Index: ${forecastMap["Visibility Index"]}`);
                console.log(`Temperature: ${forecastMap["Temperature"]} degrees`);
                console.log(`Feels Like Temperature: ${forecastMap["Feels Like Temperature"]} degrees`);
                console.log(`Precipitation Probability: ${forecastMap["Precipitation Probability"]}%`);
                console.log(`Wind Direction: ${forecastMap["Wind Direction"]}`);
                console.log(`Wind Direction Index: ${forecastMap["Wind Direction Index"]}`);
                console.log();

                return forecastMap;
            }
        });

    // get flag status from CUCBC website
    const options = {
        uri: "http://cucbc.org/flag",
        transform: function (body) {
            return cheerio.load(body);
        },
    };

    const flagStatusPromise = rp(options)
        .then(($) => $("#content-header a[href=\"/flag\"] img").attr("src"))
        .then((src) => src in flagStatusMap ? flagStatusMap[src] : "Unknown")
        .then((flagStatus) => {
            console.log(`Current Flag Status: ${flagStatus}`);
            console.log();
            return flagStatus;
        });

    // combine the promises together
    return Promise.all([weatherPromise, flagStatusPromise])
        .then(([forecast, flagStatus]) => {
            forecast["Flag Status"] = flagStatus;
            return _.mapKeys(forecast, (v, k) => _.camelCase(k));
        })
        .then((flagAndWeatherMap) => {
            const timestamp = moment().toISOString();

            const params = {
                TableName: process.env.DYNAMODB_TABLE,
                Item: {
                    id: uuid.v1(),
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    ...flagAndWeatherMap,
                },
            };

            console.log("Writing to the DynamoDB database table with params...");
            console.log(params);
            console.log();

            // write the todo to the database
            return dynamoDb.put(params).promise();
        })
        .then(() => console.log("Successfully stored result in the DynamoDB database table."))
        .catch((err) => {
            console.error("There was an error getting or storing weather or flag status...");
            console.error(err);
            console.error(err.stack);
            return;
        });
};
