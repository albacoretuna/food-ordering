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
    Joi.object({
      Timestamp: Joi.date().required(),
      'Email Address': Joi.string().email().required(),
      meal: Joi.string().min(5).regex(restaurantNamePattern).required(),
    }),
  );

  return Joi.validate(orders, ordersSchema, { allowUnknown: true }).error;
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
      createdBy: ''
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
      surveyData: orders,
      error: null,
    });

    try {
      this.setState({ loading: true });
      await persistToDatabase(orders);
      this.setState({ loading: false });
      notify.show('Orders saved successfully!', 'success', 10000);
    } catch (error) {
      notify.show('Failed to save the orders :( ', 'error', 10000);
      this.setState({ loading: false });
    }
  };

  loadSurveyData = async () => {
    try {
      const { survey_data, username } = (await axios.get('/api/survey-data/latest', {
        timeout: 10000,
      })).data;
      this.setState({
        surveyData: survey_data,
        error: null,
        loading: false,
        createdBy: username
      });
    } catch (e) {
      console.log('Getting data from database panic!: ', e);
      this.setState({
        surveyData: [],
        error: { details: [e.message], apiError: true },
        loading: false,
        createdBy: ''
      });
    }
  };

  async componentDidMount() {
    await this.loadSurveyData();
  }

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
    this.setState({ showGame: !this.state.showGame });
  };

  exitGame = () => {
    this.setState({ showGame: false });
  };

  // let rendering begin!
  render() {
    return (
      <div className="App">
        <Wrapper>
          <Header>
            <AdminSwitch handleChange={this.handleAdminSwitchChange} />
          </Header>
          <Notifications />
          {this.state.adminView &&
            <div className="admin-view">
              <h1>Admin view</h1>
              <p>
                Be careful, don't mess up
                with 200 hungry people's food orders :D{' '}
              </p>
            </div>
            }
          {this.state.error && <ErrorContainer error={this.state.error} />}

          {this.state.loading &&
            <div className="loading-holder">
              <div className="loading" />
              <p className="loading-holder__p">Loading...</p>
            </div>}

          {this.state.surveyData &&
            this.state.adminView &&
            !isEmpty(this.state.surveyData) &&
            <LatestOrderNotice
              surveyData={this.state.surveyData}
              quantity={path(['surveyData', 'length'], this.state)}
              clear={this.clearSurveyData}
              createdBy={this.state.createdBy}
            />}
          {(!this.state.surveyData || isEmpty(this.state.surveyData)) &&
            this.state.adminView &&
            !this.state.loading &&
            <FileUploader onDrop={this.onDrop} />}

          {this.state.surveyData &&
          this.state.adminView && <Fragment>
            <Mailer surveyData={this.state.surveyData} />
            <RestaurantOrders surveyData={this.state.surveyData} />
          </Fragment>}


          {this.state.surveyData &&
            !isEmpty(this.state.surveyData) &&
            !this.state.adminView &&
            <WhoOrderedWhat
              surveyData={this.state.surveyData}
              searchTerm={this.state.searchTerm}
              handleSearchTermChange={this.handleSearchTermChange}
            />}

          {this.state.surveyData &&
            isEmpty(this.state.surveyData) &&
            !this.state.adminView &&
            <OrderListEmpty
              showGame={this.state.showGame}
              activateGame={this.activateGame}
              exitGame={this.exitGame}
            />}
        </Wrapper>
        <Footer />
      </div>
    );
  }
}

export default App;
