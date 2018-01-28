import React, { Component } from 'react';
import * as CSVParser from 'papaparse';
import * as R from 'ramda';

// file uploader
import Dropzone from 'react-dropzone';
import './App.css';

/*
 * input array of objects, containing orders
 * outputs the same array, by extracting and putting the restaurant name as a property
 */
const extractRestaurantNames = surveyData => {
  const restaurantNamePattern = /^\[.+\]/;

  return surveyData.map(order => {
    if (!order.meal) return '';
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
      results['data'] && results['data'].filter(order => R.has('restaurant'));
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
          <h1 className="App-title">Pay Day Food Ordering</h1>
        </header>
        <div className="content">
          <Dropzone
            onDrop={this.onDrop.bind(this)}
            disablePreview={true}
            multiple={false}
            style={{
            display: "flex",
            border: "5px dashed lightgreen",
            width: "90%",
            maxWidth: "400px",
            height: "100px",
            textAlign: "center",
            background: "#e2f5e4",
            margin:"10px auto"
            }}
          >
            <p>Drop the .CSV file here, or click to open file browser</p>
          </Dropzone>

          <div className="orders">
            <RestaurantOrders orders={this.state.groupByMeals} />
          </div>
        </div>
      </div>
    );
  }
}

const RestaurantOrders = ({ orders }) =>
  <div>
    {orders &&
      Object.keys(orders).map((restaurant, i) =>
        <div key={i}>
          {restaurant.replace('[', '').replace(']', '')}
          <ul>
            {Object.keys(orders[restaurant]).map((food, i) =>
              <li key={i}>
                <b> {orders[restaurant][food]} </b> X {food}
              </li>,
            )}{' '}
          </ul>
        </div>,
      )}
  </div>;

export default App;
