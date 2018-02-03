import React, { Component } from 'react';
import * as CSVParser from 'papaparse';
import * as R from 'ramda';
import Joi from 'joi';

// file uploader
import Dropzone from 'react-dropzone';
import './App.css';

import { max, parse, format } from 'date-fns';

/*
 * input array of objects, containing orders
 * outputs the same array, by extracting and putting the restaurant name as a property
 */
const extractRestaurantNames = surveyData => {
  const restaurantNamePattern = /\[.+\]/;

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

const ordersSchemaIsInvalid = orders => {
  const restaurantNamePattern = /\[.+\]/;
  const ordersSchema = Joi.array().items(
    Joi.object({
      Timestamp: Joi.date().required(),
      'Email Address': Joi.string().email().required(),
      meal: Joi.string().min(5).regex(restaurantNamePattern).required(),
    }),
  );

  return Joi.validate(orders, ordersSchema, { allowUnknown: true }).error;
};
// look at the orders and find the newest
const getLatestOrder = ({ orders = [] }) =>
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
    const orders = results['data'];

    // clear previous orders
    this.setState({ surveyData: [] });

    if (ordersSchemaIsInvalid(orders)) {
      this.setState({
        error: ordersSchemaIsInvalid(orders),
        surveyData: [],
      });

      return;
    }

    this.setState({
      surveyData: orders,
      error: null,
    });
  };

  componentDidUpdate(prevProps, prevState) {
    try {
      localStorage.foodState = JSON.stringify(this.state);
    } catch (e) {
      console.log('local storage not working');
    }
  }

  clearStorage = () => {
    if (
      window.confirm(
        'Are you sure you want to delete the order information from your browser?',
      )
    ) {
      this.setState({ surveyData: [] });
    }
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Food Ordering</h1>
          <a href="https://github.com/omidfi/food-ordering" className="fork-me">
            {' '}Fork me on Github{' '}
          </a>
        </header>

        <div className="content">
          <div className="error-container">
            {this.state.error &&
              this.state.error.details.map(errMessage =>
                <p className="error-container__p">
                  <b>Problem with your uploaded .CSV file</b> <br /> Error:{' '}
                  {errMessage.message} <br />These might help: <br />{' '}
                  <ul>
                    {' '}<li>
                      {' '}Make sure the Google form collects email addresses{' '}
                    </li>
                    <li>
                      {' '}Check that the question for food is titled exactly
                      as: meal{' '}
                    </li>
                    <li> Check that in every meal name, the restaurant name is tagged in brackets for example: [Fafa] </li>

                    <li> Contact Omid :D </li>
                    <li> Contact IT </li>
                  </ul>
                </p>,
              )}
          </div>
          {this.state.surveyData &&
            !R.isEmpty(this.state.surveyData) &&
            <LatestOrderNotice
              surveyData={this.state.surveyData}
              quantity={R.path(['surveyData', 'length'], this.state)}
              clear={this.clearStorage}
            />}
          <div className="file-uploader">
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
          </div>
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
            <span className="restaurant-orders__span">
              {' '}{restaurant}{' '}
            </span>
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

// a workaround for long mailto links, from https://goo.gl/PT4WXo
const sendEmails = ({ meals, restaurant }) => {
  const timeout = 2000;

  const mailtoPrefix = `mailto:?subject=${restaurant} arrived, your food is here&body=Hello, \n Please find your selected futufriday food at the kitchen. \n Regards, FutuFriday Team&bcc=`;

  const maxUrlCharacters = 1900;
  const separator = ';';
  let currentIndex = 0;
  let nextIndex = 0;
  const emails =
    restaurant && meals[restaurant].map(meal => meal.email).join(';');

  if (!emails) {
    return;
  }

  if (emails.length < maxUrlCharacters) {
    window.location = mailtoPrefix + emails;
    return;
  }

  do {
    currentIndex = nextIndex;
    nextIndex = emails.indexOf(separator, currentIndex + 1);
  } while (nextIndex !== -1 && nextIndex < maxUrlCharacters);

  if (currentIndex === -1) {
    window.location = mailtoPrefix + emails;
  } else {
    window.location = mailtoPrefix + emails.slice(0, currentIndex);
    setTimeout(function() {
      sendEmails(emails.slice(currentIndex + 1));
    }, timeout);
  }
};

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
      <div className="mailer__wrapper">
        {meals &&
          Object.keys(meals).map((restaurant, i) =>
            <div key={i}>
              <a
                onClick={() => sendEmails({ meals, restaurant })}
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
    </div>
  );
};

const LatestOrderNotice = ({ surveyData, quantity, clear }) => {
  const latestOrder = getLatestOrder({ orders: surveyData });
  return (
    <div className="latest-order">
      latest order in the system is from:{' '}
      <b>{format(latestOrder, 'DD/MM/YYYY HH:mm')}</b>
      {' and for '}
      {quantity} {'people'}
      <button onClick={clear} className="latest-order__button">
        Clear orders
      </button>
      <p>Note: data is only in your browser, it won't affect anyone else</p>
    </div>
  );
};

export default App;
