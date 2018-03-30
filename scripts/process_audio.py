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
parser.add_argument('-viz', dest="VIZ", default=0, help="Visualize output")

args = parser.parse_args()
INPUT_DIR = args.INPUT_DIR
MANIFEST_FILE = args.MANIFEST_FILE
OUTPUT_FILE = args.OUTPUT_FILE
VIZ = (args.VIZ > 0)

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
    files[i]["lat"] = float(f["lat"])
    files[i]["lon"] = float(f["lon"])
    files[i]["hour"] = hour
    files[i]["minute"] = minute
    files[i]["duration"] = duration
    files[i].pop("time", None)

if VIZ:
    import math
    import matplotlib.pyplot as plt
    import numpy as np

    barH = 10
    yticks = []

    for i, f in enumerate(files):
        files[i]["start"] = f["hour"] * 60 + f["minute"] + f["zone"] * 60
        files[i]["end"] = files[i]["start"] + f["duration"] / 60.0
    files = sorted(files, key=lambda k: k['start'])

    fig, ax = plt.subplots()
    for i, f in enumerate(files):
        start = f["start"]
        duration = f["duration"] / 60.0
        ax.broken_barh([(start, duration)], (barH*(i+1), barH-2), facecolors='blue')
        yticks.append(barH*(i+1) + barH/2)

    def ceilToNearest(x, nearest):
        return int(math.ceil(1.0 * x / nearest)) * nearest

    def floorToNearest(x, nearest):
        return int(math.floor(1.0 * x / nearest)) * nearest

    start = floorToNearest(min([f["start"] for f in files]), 60)
    end = ceilToNearest(max([f["end"] for f in files]), 60)
    ax.set_xticks(np.arange(start, end, 60))
    ax.set_yticks(yticks)

    ylabels = [f["filename"].replace(".mp3", "") for f in files]
    ax.set_yticklabels(ylabels)
    ax.grid(True)

    plt.show()

    sys.exit(1)


jsonString = "var MANIFEST = " + json.dumps(files, indent=2, sort_keys=True) + ";"

with open(OUTPUT_FILE, "w") as f:
    f.write(jsonString)
print "Done."
