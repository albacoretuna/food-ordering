import React, { Component } from 'react';
import * as CSVParser from 'papaparse';
import * as R from 'ramda';

// file uploader
import Dropzone from 'react-dropzone';
import './App.css';

import { max, parse, format } from 'date-fns';

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
      requestedBy: order['Email Address'].split('@')[0],
    };
  });
};

// look at the orders and find the newest
const getLatestOrder = orders =>
  max.apply(null, orders.map(order => parse(order.Timestamp)));
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
    this.state = JSON.parse(localStorage.getItem('foodState')) || {};
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
      latestOrder: getLatestOrder(orders),
    });
  };

  componentDidUpdate(prevProps, prevState) {
    try {
      localStorage.foodState = JSON.stringify(this.state);
    } catch (e) {
      console.log('local storage not working');
    }
  }

  render() {
    return (
      <div className="App">
        <ForkMeRibbon />
        <header className="App-header">
          <h1 className="App-title">Food Ordering</h1>
        </header>

        <div className="content">
          {this.state.latestOrder &&
            <LatestOrderNotice
              latestOrder={this.state.latestOrder}
              quantity={this.state.surveyData.length}
            />}
          <Dropzone
            onDrop={this.onDrop}
            disablePreview={true}
            multiple={false}
            style={{
              display: 'flex',
              border: '5px dashed #00BCD4',
              width: '90%',
              maxWidth: '400px',
              minHeight: '50px',
              textAlign: 'center',
              background: 'rgba(0, 188, 212, 0.07)',
              margin: '10px auto',
            }}
          >
            <p>
              Drop the orders .csv file here, or click to open a file browser
            </p>
          </Dropzone>
          <div className="mailer">
            <Mailer surveyData={this.state.surveyData} />
          </div>
          <div className="orders">
            <RestaurantOrders surveyData={this.state.surveyData} />
          </div>
          <div className="who-orderd-what">
            <WhoOrderedWhat surveyData={this.state.surveyData} />
          </div>
        </div>
      </div>
    );
  }
}

const RestaurantOrders = ({ surveyData = [] }) => {
  const orders = groupByMeals(
    groupByRestaurants(extractRestaurantNames(surveyData)),
  );
  return (
    <div className="restaurant-orders">
      {R.isEmpty(orders) &&
        <p>
          Orders and buttons will appear down here after uploading the file
        </p>}
      {!R.isEmpty(orders) &&
        <p className="restaurant-orders__p">
          The following need to be sent to the restaurants
        </p>}
      {orders &&
        Object.keys(orders).map((restaurant, i) =>
          <div key={i}>
            {restaurant}
            <ul>
              {Object.keys(orders[restaurant]).map((food, i) =>
                <li key={i}>
                  <b> {orders[restaurant][food]} </b> X {food}
                </li>,
              )}{' '}
            </ul>
          </div>,
        )}
    </div>
  );
};

// who ordered what
const WhoOrderedWhat = ({ surveyData = [] }) => {
  const orders = surveyData.map(order => ({
    name: order['Email Address'].split('@')[0].replace(/\./g, ' '),
    meal: order.meal,
  }));
  const sortByNameCaseInsensitive = R.sortBy(
    R.compose(R.toLower, R.prop('name')),
  );
  const sortedOrders = sortByNameCaseInsensitive(orders);
  console.log(sortedOrders);

  return (
    <ol className="who-ordered-what__ol">
      <p className="restaurant-orders__p">Who orderd what?</p>
      {sortedOrders &&
        sortedOrders.map((order, i) =>
          <li key={i}>
           <span className="who-ordered-what__span"> {order.name}</span>{' '}
             {order.meal}
          </li>,
        )}
    </ol>
  );
};
const mailToLink = ({ meals, restaurant }) =>
  `mailto:${meals[restaurant].map(
    meal => meal.email,
  )[0]}?subject=${restaurant} arrived, your food is here&cc=${meals[
    restaurant
  ].shift() &&
    meals[restaurant]
      .map(meal => meal.email)
      .join(
        ',',
      )}&body=Hello my futurice colleague, \n Please find your selected futufriday food at the kitchen. \n Warm regards, FutuFriday Team`;

const Mailer = ({ surveyData = [] }) => {
  const meals = groupByRestaurants(extractRestaurantNames(surveyData));

  if (R.isEmpty(meals)) return <div />;
  return (
    <div className="mailer__div">
      {meals &&
        <p className="mailer__p">
          Press each button to send an email to the people who have ordered from
          that restaurant
        </p>}
      {meals &&
        Object.keys(meals).map((restaurant, i) =>
          <div key={i}>
            <a
              href={encodeURI(mailToLink({ meals, restaurant }))}
              className="mail-link"
            >
              <b className="restaurant-name">
                {restaurant.replace('[', '').replace(']', '')}
              </b>{' '}
              Arrived!
            </a>
          </div>,
        )}
      {meals &&
        <div>
          <a
            href={encodeURI(
              "mailto:helsinki@futurice.com?subject=Extra food is here&body=If you haven't ordered food, you need to know that extra food has arrived! Warm regards, FutuFriday team",
            )}
            className="mail-link"
          >
            <b className="restaurant-name">Extra Food</b> Arrived! Send email
          </a>
        </div>}
    </div>
  );
};

const ForkMeRibbon = () =>
  <a href="https://github.com/omidfi/food-ordering">
    <img
      style={{ position: 'absolute', top: '0', right: '0', border: '0' }}
      src="https://camo.githubusercontent.com/52760788cde945287fbb584134c4cbc2bc36f904/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f77686974655f6666666666662e706e67"
      alt="Fork me on GitHub"
      data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_white_ffffff.png"
    />
  </a>;

const LatestOrderNotice = ({ latestOrder, quantity }) =>
  <div className="latest-order">
    latest order in the system is from:{' '}
    {format(latestOrder, 'DD/MM/YYYY HH:mm')}
    {' and for '}
    {quantity} {'people'}
  </div>;
export default App;
