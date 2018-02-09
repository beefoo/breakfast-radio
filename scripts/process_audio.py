# -*- coding: utf-8 -*-

import argparse
import csv
import json
from mutagen.mp3 import MP3
import os
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_DIR", default="../audio/", help="Input directory")
parser.add_argument('-manifest', dest="MANIFEST_FILE", default="manifest.csv", help="Input manifest csv file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="../js/manifest.js", help="Javascript output file")

args = parser.parse_args()
INPUT_DIR = args.INPUT_DIR
MANIFEST_FILE = args.MANIFEST_FILE
OUTPUT_FILE = args.OUTPUT_FILE

files = []
with open(MANIFEST_FILE, 'rb') as f:
    reader = csv.DictReader(f)
    files = list(reader)

print "Reading files..."
for i, f in enumerate(files):
    audio = MP3(INPUT_DIR + f["filename"])
    duration = audio.info.length
    time, ampm = tuple(f["time"].split(" "))
    hour, minute = tuple([int(t) for t in time.split(":")])
    if ampm == "PM":
        hour += 12
    files[i]["zone"] = int(f["zone"])
    files[i]["hour"] = hour
    files[i]["minute"] = minute
    files[i]["duration"] = duration
    files[i].pop("time", None)

jsonString = "var MANIFEST = " + json.dumps(files, indent=2, sort_keys=True) + ";"

with open(OUTPUT_FILE, "w") as f:
    f.write(jsonString)
print "Done."
