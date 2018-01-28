import React, { Component } from 'react';
import * as CSVParser from 'papaparse';
import * as R from 'ramda';

// file uploader
import Dropzone from 'react-dropzone';
import './App.css';

var data = [
  {
    'Email Address': 'grace.hopper@nasa.com',
    Timestamp: '1/28/2018 10:58:57',
    'Your Name': 'Omid',
    meal:
      ' [SenChay SC02 Vermicelli salad (vermicelli, Chinese cabbage, carrot, cucumber, tofu, sesame, soy wasabi sauce)',
  },
  {
    'Email Address': 'rosa.parks@blah.com',
    Timestamp: '1/28/2018 11:58:57',
    'Your Name': 'Ali',
    meal: '[Fafa] Halumi ',
  },
  {
    'Email Address': 'blah@blah.com',
    Timestamp: '1/28/2018 11:58:57',
    'Your Name': 'Ali',
    meal: '[Fafa] Halumi ',
  },
];

/*
 * input array of objects, containing orders
 * outputs the same array, by extracting and putting the restaurant name as a property
 */
const extractRestaurantNames = surveyData => {
  const restaurantNamePattern = /^\[.+\]/;

  return surveyData.map(order => {
    return {
      meal: order.meal,
      restaurant: R.toLower(
        R.match(restaurantNamePattern, R.trim(order.meal))[0] ||
          '[unknown_restaurant]',
      ),
      email: order['Email Address'],
      requestedBy: order['Your Name'],
    };
  });
};

const groupByRestaurants = data => {
  const byRestaurant = R.groupBy(order => order.restaurant)
  return byRestaurant(data)
};

const reduceMeals = data => {

}


console.log('group by restaurant ', groupByRestaurants(extractRestaurantNames(data)));

class App extends Component {
  constructor() {
    super();
    this.state = { surveyData: [] };
  }

  onDrop = files => {
    let onComplete = this.parseComplete;

    let CSVParserConfig = {
      delimiter: '', // auto-detect
      newline: '', // auto-detect
      quoteChar: '"',
      header: true,
      dynamicTyping: false,
      preview: 0,
      encoding: '',
      worker: false,
      comments: false,
      step: undefined,
      complete: onComplete,
      error: undefined,
      download: false,
      skipEmptyLines: false,
      chunk: undefined,
      fastMode: undefined,
      beforeFirstChunk: undefined,
      withCredentials: undefined,
    };

    CSVParser.parse(files[0], CSVParserConfig);
  };

  parseComplete = results => {
    this.setState({
      surveyData: results['data'],
    });
    console.log('surveyData', results['data']);
  };

  // input an array of objects, each a string containing restaurant tag and food name
  // returns an object, keys are restaurant names, values are orders group by food names
  // {fafa: [{food: "halumi salad", quantity: 5}]}
  // if no restaurant name found, default to UNKNOWN
  ordersByRestaurants = surveyData => {
    surveyData.map();
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">PayDay order</h1>
        </header>
        <Dropzone
          onDrop={this.onDrop.bind(this)}
          disablePreview={true}
          accept="text/csv"
        >
          <p>Drop the .CSV file her, or click to open file browser</p>
        </Dropzone>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
