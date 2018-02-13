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
};

class Game extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  componentDidMount() {
    this.setState({ gameStartedAt: Date.now() });
    notify.show('Try to grab the vegetables!', 'custom', 5000, {
      background: 'yellow',
      text: 'black',
    });
  }

  resetGame = () => {
    this.setState(initialState, () => {
      this.setState({ gameStartedAt: Date.now() });
    });
  };
  closeRecordDisplay = () => {
    this.setState({record: null});
  }

  shoot = target => {
    switch (target) {
      case 'tomato':
        this.setState({ tomatoShotAt: Date.now() }, () => {
          if (this.state.broccoliShotAt !== 0) {
            this.setState({
              record:
                (this.state.tomatoShotAt - this.state.gameStartedAt) / 1000,
            });
          }
        });
        break;
      case 'broccoli':
        this.setState({ broccoliShotAt: Date.now() }, () => {
          if (this.state.tomatoShotAt !== 0) {
            this.setState({
              record:
                (this.state.broccoliShotAt - this.state.gameStartedAt) / 1000,
            });
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
