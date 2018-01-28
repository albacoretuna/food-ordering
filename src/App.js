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
      ' [SenChay] SC02 Vermicelli salad (vermicelli, Chinese cabbage, carrot, cucumber, tofu, sesame, soy wasabi sauce)',
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
    if (!order.meal) return;
    return {
      meal: R.trim(order.meal || ''),
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
  const byRestaurant = R.groupBy(order => order.restaurant);
  return byRestaurant(data);
};

const groupByMeals = data => {
  const reducer = (acc, order) => {
    if (!acc[order.meal]) {
      acc[order.meal] = 1;
    } else {
      acc[order.meal] = acc[order.meal] + 1;
    }

    return acc;
  };

  const countMeals = value => value.reduce(reducer, {});

  return R.map(countMeals, data);
};

console.log(
  'group by meals',
  groupByMeals(groupByRestaurants(extractRestaurantNames(data))),
);

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
      skipEmptyLines: true,
      chunk: undefined,
      fastMode: undefined,
      beforeFirstChunk: undefined,
      withCredentials: undefined,
    };

    CSVParser.parse(files[0], CSVParserConfig);
  };

  parseComplete = results => {
    const orders =
      results['data'] && results['data'].filter(order => !R.isEmpty(order));
    console.log('orders is', orders);
    this.setState({
      surveyData: orders,
      groupedByRestaurants: groupByRestaurants(extractRestaurantNames(orders)),
      groupByMeals: groupByMeals(
        groupByRestaurants(extractRestaurantNames(orders)),
      ),
    });
    console.log('state', this.state);
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">PayDay order</h1>
        </header>
        <Dropzone onDrop={this.onDrop.bind(this)} disablePreview={true}>
          <p>Drop the .CSV file her, or click to open file browser</p>
        </Dropzone>

        <div>
          <RestaurantOrders orders={this.state.groupByMeals} />
        </div>
      </div>
    );
  }
}

const RestaurantOrders = ({ orders }) =>
  <div>
    {orders &&
      Object.keys(orders).map(restaurant =>
        <ul>
          {' '}{console.log(orders) ||
            Object.keys(orders[restaurant]).map(food =>
              <li>
                {food} Quantity: {orders[restaurant][food]}
              </li>,
            )}{' '}
        </ul>,
      )}
  </div>;

export default App;
