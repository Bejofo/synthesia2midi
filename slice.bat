@echo off 
cd /D "%~dp0"
set /p id="Enter Filename: "
set /p framerate="Enter framerate: "
rem 1280 
rem 400
rem ffmpeg -i trashmachine.png -filter edgedetect=low=0.1:high=0.4 output.png
ffmpeg -ss 00:00:04 -i %id%  -filter:v "crop=in_w:2:0:900" -vframes 1 -q:v 2 cal.jpg
ffmpeg -ss 00:00:04 -i %id% -filter:v "crop=in_w:2:0:900"  -r %framerate% stuff/MYIMG%%06d.jpg
set /p mframe="Enter frames to merge: "
node run.js %mframe% 1920