import React, { Component, Fragment } from 'react';
import * as CSVParser from 'papaparse';

import Joi from 'joi-browser';
import axios from 'axios';
import Notifications, { notify } from 'react-notify-toast';

import { path, isEmpty } from 'ramda';

// styles
import '../node_modules/css-toggle-switch/dist/toggle-switch.css';
import './App.css';

// react components
import {
  Header,
  Footer,
  Wrapper,
  WhoOrderedWhat,
  AdminSwitch,
  ErrorContainer,
  LatestOrderNotice,
  FileUploader,
  Mailer,
  RestaurantOrders,
  OrderListEmpty,
} from './Components';

// utility functions
/**
 * ordersSchemaIsInvalid
 *
 * @returns {null} or an {object} containing validation error details
 */
const ordersSchemaIsInvalid = orders => {
  const restaurantNamePattern = /\[.+\]/;
  const ordersSchema = Joi.array().items(
    Joi.alternatives().try(
      Joi.object({
        Timestamp: Joi.date().required(),
        'Email Address': Joi.string().email().required(),
        meal: Joi.string().min(5).regex(restaurantNamePattern).required(),
      }).example({
        Timestamp: '2018/02/26 9:42:01 AM GMT+2',
        'Email Address': 'Rosa.Parks@civilrights.com',
        meal: '[Fafa] RP01 Vegan Mezze',
      }),
      Joi.object({
        Timestamp: Joi.date().required(),
        Username: Joi.string().email().required(),
        meal: Joi.string().min(5).regex(restaurantNamePattern).required(),
      }).example({
        Timestamp: '2018/02/26 9:42:01 AM GMT+2',
        Username: 'Rosa.Parks@civilrights.com',
        meal: '[Fafa] RP01 Vegan Mezze',
      }),
    ),
  );

  return Joi.validate(orders, ordersSchema, { allowUnknown: true }).error;
};

const renameOrderKeys = ({ orders }) => {
  if (!orders[0]) {
    return orders;
  }

  if (orders[0].Username) {
    return orders.map(order => {
      const renamedOrder = {};
      renamedOrder.Timestamp = order.Timestamp;
      renamedOrder['Email Address'] = order.Username;
      renamedOrder.meal = order.meal;

      return renamedOrder;
    });
  }
  return orders;
};

const persistToDatabase = data =>
  axios.post('/api/survey-data/add', { surveyData: data });

// Our one and only App, the main react component in this application
class App extends Component {
  constructor() {
    super();
    this.state = {
      surveyData: [],
      error: null,
      adminView: false,
      loading: true,
      searchTerm: '',
      showGame: false,
      createdBy: '',
    };
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

  parseComplete = async results => {
    const orders = results['data'];

    // clear previous orders
    this.setState({ surveyData: [] });

    if (ordersSchemaIsInvalid(orders)) {
      this.setState({
        surveyData: [],
        error: ordersSchemaIsInvalid(orders),
      });

      return;
    }

    this.setState({
      surveyData: renameOrderKeys({ orders }),
      error: null,
    });

    try {
      this.setState({ loading: true });
      await persistToDatabase(renameOrderKeys({ orders }));
      this.setState({ loading: false });
      notify.show('Orders saved successfully!', 'success', 10000);
    } catch (error) {
      notify.show('Failed to save the orders :( ', 'error', 10000);
      this.setState({ loading: false });
    }
  };

  loadSurveyData = async () => {
    try {
      const {
        survey_data,
        username,
      } = (await axios.get('/api/survey-data/latest', {
        timeout: 10000,
      })).data;
      this.setState({
        surveyData: survey_data,
        error: null,
        loading: false,
        createdBy: username,
      });
    } catch (e) {
      console.log('Getting data from database panic!: ', e);
      this.setState({
        surveyData: [],
        error: { details: [e.message], apiError: true },
        loading: false,
        createdBy: '',
      });
    }
  };

  async componentDidMount() {
    await this.loadSurveyData();
  }
  loadSampleData = () => {
    this.setState({
      surveyData: [
        {
          Timestamp: '2018/02/26 9:42:01 AM GMT+2',
          'Email Address': 'Rosa.Parks@civilrights.com',
          meal: '[Fafa] RP01 Vegan Mezze',
        },
        {
          Timestamp: '2018/02/27 9:42:01 AM GMT+2',
          'Email Address': 'Red.Panda@wwf.com',
          meal: '[KotiPizza] KO3 Margaritha pizza',
        },
        {
          Timestamp: '2018/02/23 9:42:01 AM GMT+2',
          'Email Address': 'Happy.Sloth@wwf.com',
          meal: '[Fafa] RP01 Vegan Mezze',
        },
      ],
    });
  };
  clearSurveyData = async () => {
    if (window.confirm('Are you sure you want to cleare these information?')) {
      this.setState({
        surveyData: [],
        error: null,
        loading: false,
      });
      try {
        this.setState({ loading: true });
        await persistToDatabase([]);
        this.setState({ loading: false });
        notify.show('Orders removed successfully!', 'success', 5000);
      } catch (error) {
        notify.show('Failed to clear the orders :( ', 'error', 10000);
        this.setState({ loading: false });
      }
    }
  };

  handleSearchTermChange = value => {
    this.setState({
      searchTerm: value,
    });
  };

  handleAdminSwitchChange = event => {
    this.setState({
      adminView: event.target.checked,
    });
  };

  activateGame = () => {
    this.setState({ showGame: true });
  };

  exitGame = () => {
    this.setState({ showGame: false });
  };

  // let rendering begin!
  render() {
    const {
      adminView,
      loading,
      surveyData,
      error,
      createdBy,
      showGame,
      searchTerm,
    } = this.state;
    return (
      <div className="App">
        <Wrapper>
          <Header>
            <AdminSwitch handleChange={this.handleAdminSwitchChange} />
          </Header>
          <Notifications />
          {adminView &&
            <div className="admin-view">
              <h1>Admin view</h1>
              <p>
                Be careful, don't mess up with 200 hungry people's food orders
                :D <br /> {' '}
                Your Username will be saved automatically.
              </p>
            </div>}
          {error && <ErrorContainer error={error} />}

          {loading &&
            <div className="loading-holder">
              <div className="loading" />
              <p className="loading-holder__p">Loading...</p>
            </div>}

          {surveyData &&
            adminView &&
            !isEmpty(surveyData) &&
            <LatestOrderNotice
              surveyData={surveyData}
              quantity={path(['surveyData', 'length'], this.state)}
              clear={this.clearSurveyData}
              createdBy={createdBy}
            />}
          {(!surveyData || isEmpty(surveyData)) &&
            adminView &&
            !loading &&
            <FileUploader onDrop={this.onDrop} />}

          {surveyData &&
            adminView &&
            <Fragment>
              <Mailer surveyData={surveyData} />
              <RestaurantOrders surveyData={surveyData} />
            </Fragment>}

          {surveyData &&
            !isEmpty(surveyData) &&
            !adminView &&
            <WhoOrderedWhat
              surveyData={surveyData}
              searchTerm={searchTerm}
              handleSearchTermChange={this.handleSearchTermChange}
            />}

          {surveyData &&
            !loading &&
            isEmpty(surveyData) &&
            !adminView &&
            <OrderListEmpty
              showGame={showGame}
              activateGame={this.activateGame}
              exitGame={this.exitGame}
              loadSampleData={this.loadSampleData}
            />}
        </Wrapper>
        <Footer />
      </div>
    );
  }
}

export default App;
