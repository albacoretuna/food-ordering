# Food Orderering Web App

Order food for 200 peple, more easily.

## Install

```bash
# clone this repo

cd food-ordering

npm install

# add DB_URL to the environment variables, it should be a valid postgress connection string

npm start

# point your browser to localhost:3000
```

## What? Why?
My colleague orders around 200 meals for us on a single day, every month. This is a single web app that automates some parts of that process.

## How
1. Send out a survey using Google forms, the form needs to ask for two things:
  a. meal. What each person likes to eat on that day?
  b. Email Address.

2. Open the responses in the Google sheets, and download the file as CSV.

3. Open this web app, upload the CSV and the app creates seperate ordes for each restaurant.

4. Also on the feast day, each person can check this app to see what they had ordered, i.e. what food should they look for at the kitchen


## Requirements

nodejs, npm, postgress


## Credits
All the SVG clip arts from openclipart.org
