import React, { Component } from 'react';

import { notify } from 'react-notify-toast';

// images
import TomatoSvg from './img/tomato.svg';
import BroccoliSvg from './img/broccoli.svg';

const initialState = {
  gameStartedAt: 0,
  tomatoShotAt: 0,
  broccoliShotAt: 0,
  record: null,
  bestRecord: 10000000,
};

class Game extends Component {
  constructor() {
    super();
    this.state = initialState;
  }
  updateBestRecord = ({record}) => {
    const bestRecord = parseFloat(this.state.bestRecord, 10);
    if( bestRecord > parseFloat(record, 10)) {
      this.setState({bestRecord: parseFloat(record, 10)})
    }
  }
  componentDidMount() {
    this.setState({ gameStartedAt: Date.now() });
    notify.show('Tap or Click on the vegetables as quickly as you can!', 'custom', 5000, {
      background: 'yellow',
      text: 'black',
    });
  }

  resetGame = () => {
    const bestRecord = this.state.bestRecord;
    this.setState(initialState, () => {
      this.setState({
        gameStartedAt: Date.now(),
        bestRecord
      });
    });
  };
  closeRecordDisplay = () => {
    this.props.activateGame();
    this.setState({record: null});
  }

  shoot = target => {
    switch (target) {
      case 'tomato':
        this.setState({ tomatoShotAt: Date.now() }, () => {
          if (this.state.broccoliShotAt !== 0) {
            const record = (this.state.tomatoShotAt - this.state.gameStartedAt) / 1000
            this.setState({record});
            this.updateBestRecord({record})
          }
        });
        break;
      case 'broccoli':
        this.setState({ broccoliShotAt: Date.now() }, () => {
          if (this.state.tomatoShotAt !== 0) {
            const record = (this.state.broccoliShotAt - this.state.gameStartedAt) / 1000;
            this.setState({record});
            this.updateBestRecord({record})
          }
        });
        break;
      default:
        break;
    }
  };

  render() {
    return (
      <React.Fragment>
        <div />
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
            {' '}<p>Your record: {this.state.record} seconds</p>{' '}
            {' '}<p>Your best record: {this.state.bestRecord} seconds</p>{' '}
            <button onClick={this.resetGame} className="game-result__button">
              Play Again
            </button>

            <button onClick={this.closeRecordDisplay} className="game-result__button">
              Close
            </button>
          </div>}
      </React.Fragment>
    );
  }
}

export default Game;
