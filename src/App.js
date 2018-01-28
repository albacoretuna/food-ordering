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
    this.setState({
      surveyData: orders,
      groupByRestaurants: groupByRestaurants(extractRestaurantNames(orders)),
      groupByMeals: groupByMeals(
        groupByRestaurants(extractRestaurantNames(orders)),
      ),
    });
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Food Ordering</h1>
        </header>
        <div className="content">
          <Dropzone
            onDrop={this.onDrop.bind(this)}
            disablePreview={true}
            multiple={false}
            style={{
              display: 'flex',
              border: '5px dashed lightgreen',
              width: '90%',
              maxWidth: '400px',
              height: '100px',
              textAlign: 'center',
              background: '#e2f5e4',
              margin: '10px auto',
            }}
          >
            <p>Drop the orders .csv file here, or click to open a file browser</p>
          </Dropzone>
          <div className="mailer">
            <Mailer meals={this.state.groupByRestaurants} />
          </div>
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

    {!orders && <p>Orders and buttons will appear down here after uploading the file</p>
    }
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

const mailToLink = ({ meals, restaurant }) =>
  `mailto:${meals[restaurant].map(
    meal => meal.email,
  )[0]}?subject=${restaurant} arrived, your food is here&cc=${meals[
    restaurant
  ].shift() && meals[restaurant].map(meal => meal.email).join(',')}&body=Hello my futurice colleague, \n Please find your selected futufriday food at the kitchen. \n Warm regards, FutuFriday Team`;

const Mailer = ({ meals }) =>
  <div>
    {meals &&
      Object.keys(meals).map(
        (restaurant, i) =>
          console.log(restaurant) ||
          <div key={i}>
            <a
              href={encodeURI(mailToLink({ meals, restaurant }))}
              className="mail-link"
            >
              <b className="restaurant-name">
                {restaurant.replace('[', '').replace(']', '')}
              </b>{' '}
              Arrived! Send email
            </a>
          </div>,
      )}
          <div >
            <a
              href={encodeURI("mailto:helsinki@futurice.com?subject=Extra food is here&body=If you haven't ordered food, you need to know that extra food has arrived! Warm regards, FutuFriday team")}
              className="mail-link"
            >
              <b className="restaurant-name">
                Extra Food
              </b>{' '}
              Arrived! Send email
            </a>
          </div>,
  </div>;

export default App;
