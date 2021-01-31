# AutoHealthCard
![auto_health_card](https://github.com/Jasonzj/AutoHealthCard/workflows/auto_health_card/badge.svg)

吉珠自动填写健康卡

## Usage:

### Method 1: 
1. Create a new repository
2. Copy the .github directory to your own repository
3. Set the [Secrets](#Secrets)

### Method 2 (Recommended):
1. Fork this repository
2. In your forked repository
3. Set the [Secrets](#Secrets)
5. Configure [Pull](https://github.com/wei/pull) to update your repository whenever upstream updates.

The action will automatically run at 10 and 11am(GMT+8) everyday.

## Secrets
|name|description|necessary|
|---|---|---|
|SCKEY|server酱|:heavy_multiplication_x:|
|USERNAME||:heavy_check_mark:|
|PASSWORD||:heavy_check_mark:|
|RANGE|student id range<br>set will start request mode<br>examples:<br>`04181101:04181120`<br>support multiple ranges<br>`04181101:04181110,04182201:04182215`<br>support single student id<br>`04181101,04181102,04181103`<br>support mixed single student id and range<br>`04181101:04181110,04181115,04181216:04181220`|:heavy_multiplication_x:|
|LIMIT|concurrence limit<br>default value is 1|:heavy_multiplication_x:|
|DATERANGE|date range<br>set the date range that will be specified for request mode<br>examples:<br>`2021-01-01:2021-01-10`<br>support multiple ranges<br>`2021-01-01:2021-01-05,2021-01-10:2021-01-15`<br>support single date<br>`2021-01-01,2021-01-03,2021-01-06`<br>support mixed single date and range<br>`2021-01-01:2021-01-05,2021-01-07,2021-01-15:2021-01-20`|:heavy_multiplication_x:| 

This repository has two different mode scripts that sign-in, one is browser mode and the other is request mode.

Set `USERNAME` and `PASSWORD` will run **browser mode** by default.

Continuing to set `RANGE` and `LIMIT` will enable **request mode**. 

> Notice: if the RANGE difference is greater than 10, the log will not be pushed to WeChat 

