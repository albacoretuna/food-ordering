import React, { Component } from 'react';

// images
import TomatoSvg from './img/tomato.svg';
import BroccoliSvg from './img/broccoli.svg';

const initialState = {
  gameStartedAt: 0,
  tomatoShotAt: 0,
  broccoliShotAt: 0,
  record: null,
  bestRecord: 10000000,
  duration: 0,
  clicks: 0,
  gameEnded: false
};

class Game extends Component {
  constructor() {
    super();
    this.state = initialState;
  }
  updateBestRecord = ({ record }) => {
    const bestRecord = parseFloat(this.state.bestRecord, 10);
    if (bestRecord > parseFloat(record, 10)) {
      this.setState({ bestRecord: parseFloat(record, 10)});
    }
  };
  componentDidMount() {
    this.setState({ gameStartedAt: Date.now() });
    let timer = setInterval(() => {
      this.updateDuration();
    }, 100);
    this.setState({ timer });
  }

  updateDuration() {
    this.setState({
      duration: ((Date.now() - this.state.gameStartedAt) / 1000).toFixed(1),
    });
  }

  stopTimer() {
    clearInterval(this.state.timer);
  }

  resetGame = () => {
    const bestRecord = this.state.bestRecord;
    let timer = setInterval(() => {
      this.updateDuration();
    }, 100);
    this.setState(initialState, () => {
      this.setState({
        gameStartedAt: Date.now(),
        bestRecord,
        timer,
        clicks: 0
      });
    });
  };

  countClicks = () => {
    if(this.state.gameEnded)
      return;
    this.setState({
      clicks: this.state.clicks + 1,
    });
  }

  shoot = target => {
    switch (target) {
      case 'tomato':
        this.setState({ tomatoShotAt: Date.now() }, () => {
          if (this.state.broccoliShotAt !== 0) {
            const record =
              (this.state.tomatoShotAt - this.state.gameStartedAt) / 1000;
            this.setState({ record, gameEnded: true });
            this.updateBestRecord({ record });
            this.stopTimer();
          }
        });
        break;
      case 'broccoli':
        this.setState({ broccoliShotAt: Date.now() }, () => {
          if (this.state.tomatoShotAt !== 0) {
            const record =
              (this.state.broccoliShotAt - this.state.gameStartedAt) / 1000;
            this.setState({ record, gameEnded: true });
            this.updateBestRecord({ record });
            this.stopTimer();
          }
        });
        break;
      default:
        break;
    }
  };

  render() {
    return (
      <div className="game-area" onClick={() => {this.countClicks()}}>
        <button
          className="game-area__button"
          onClick={() => {
            this.props.exitGame();
          }}
        >
          X
        </button>
        {this.state.tomatoShotAt === 0 &&
          <img
            alt="tomato"
            className="tomato"
            src={TomatoSvg}
            onClick={() => {
              this.shoot('tomato');
            }}
          />}
        {this.state.broccoliShotAt === 0 &&
          <img
            alt="broccoli"
            className="broccoli"
            src={BroccoliSvg}
            onClick={() => {
              this.shoot('broccoli');
            }}
          />}
        {this.state.record &&
          <div className="game-result">
            <h1>You won!</h1> <p>Your record: {this.state.record} seconds</p> {' '}
            <p> clicks: {this.state.clicks} </p>
            <p>Your best record: {this.state.bestRecord} seconds</p>{' '}
            <button onClick={this.resetGame} className="game-result__button">
              Play Again
            </button>
            <button
              onClick={() => {
                this.props.exitGame();
              }}
              className="game-result__button"
            >
              Close
            </button>
          </div>}
        <div className="game-area__div">
          Click on each vegetable as quickly as you can!{' '}
        </div>
        <div className="game-area__div--timer">
          {this.state.duration} seconds
        </div>
      </div>
    );
  }
}

export default Game;
