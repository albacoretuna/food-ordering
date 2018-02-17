require('dotenv').config();

// express
const express = require('express');
const bodyParser = require('body-parser');
const Router = require('express-promise-router');
const app = express();
const router = new Router();
app.use(bodyParser.json());

const path = require('path');

// postgress
const { Pool } = require('pg');
const connectionString = process.env.DB_URL;
const pool = new Pool({ connectionString });
const query = (text, params) => pool.query(text, params);

// validation
const Joi = require('joi');

/**
 * ordersSchemaIsInvalid
 *
 * @returns {null} or an {object} containing validation error details
 */
const ordersSchemaIsInvalid = ({ surveyData }) => {
  const restaurantNamePattern = /\[.+\]/;
  const orderSchema = Joi.object().keys({
    Timestamp: Joi.date().required(),
    'Email Address': Joi.string().email().required(),
    meal: Joi.string().min(5).regex(restaurantNamePattern).required(),
  });
  const ordersSchema = Joi.array().items(orderSchema);

  return Joi.validate(surveyData, ordersSchema, {
    allowUnknown: true,
  }).error;
};

/**
 orders table is like this, for now title, and archived are note used
 CREATE TABLE orders (
   ID serial NOT NULL PRIMARY KEY,
   title VARCHAR (100),
   survey_data jsonb NOT NULL,
   created_at timestamptz default now() not null,
   archived boolean DEFAULT false,
   username VARCHAR
 );
 */

app.post('/api/survey-data/add', async (req, res) => {
  const { surveyData } = req.body;
  const user =  req.headers["remote-user"] || 'unknown';
  const validationError = ordersSchemaIsInvalid({ surveyData });
  if (!surveyData || validationError) {
    res.status(400).send(validationError);
  }
  try {
    const {
      rows,
    } = await query(
      'INSERT INTO orders (survey_data, username) VALUES ($1, $2) RETURNING id',
      [JSON.stringify(surveyData), user],
    );
    res.send(rows[0]);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get('/api/survey-data/all', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM orders ORDER BY id DESC');
    res.send(rows);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get('/api/survey-data/latest', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT survey_data, created_at, username FROM orders ORDER by id desc LIMIT 1',
    );
    res.send(rows[0]);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get('/api/survey-data/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [
      id,
    ]);
    res.send(rows[0]);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.use(express.static(path.resolve(__dirname, 'build')));

// Always return the main index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

const server = app.listen(8000, () => {
  console.log('server started on: ', server.address().port);
});
