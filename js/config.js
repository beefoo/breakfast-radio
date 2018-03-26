var CONFIG = {
  "knobSensitivity": 0.5, // higher = more sensitive
  "audioDir": "audio/",
  "minTime": 0,
  "maxTime": 43200, // noon = 12 * 60 * 60 = 43200
  "timePad": 0, // in seconds
  "placePad": 20, // in degrees longitude (15 deg per timezone)
  "seekMs": 1000
};

var TIMEZONES = [
  "Midway Islands Time (GMT-11:00)",
  "Hawaii Standard Time (GMT-10:00)",
  "Alaska Standard Time (GMT-9:00)",
  "Pacific Standard Time (GMT-8:00)",
  "Mountain Standard Time (GMT-7:00)",
  "Central Standard Time (GMT-6:00)",
  "Eastern Standard Time (GMT-5:00)",
  "Puerto Rico and US Virgin Islands Time (GMT-4:00)",
  "Brazil Eastern Time (GMT-3:00)",
  "Fernando de Noronha Time (GMT-2:00)",
  "Central African Time (GMT-1:00)",
  "Greenwich Mean Time (GMT)",
  "European Central Time (GMT+1:00)",
  "Eastern European Time (GMT+2:00)",
  "Eastern African Time (GMT+3:00)",
  "Near East Time (GMT+4:00)",
  "Pakistan Lahore Time (GMT+5:00)",
  "Bangladesh Standard Time (GMT+6:00)",
  "Vietnam Standard Time (GMT+7:00)",
  "China Taiwan Time (GMT+8:00)",
  "Japan Standard Time (GMT+9:00)",
  "Australia Eastern Time (GMT+10:00)",
  "Solomon Standard Time (GMT+11:00)",
  "New Zealand Standard Time (GMT+12:00)"
];
