require('dotenv').config();

/**
 orders table is like this, for now title, and archived are note used
 CREATE TABLE orders (
   ID serial NOT NULL PRIMARY KEY,
   title VARCHAR (100),
   survey_data jsonb NOT NULL,
   created_at timestamptz default now() not null,
   archived boolean DEFAULT false
 );
 */


// express
const express = require('express');
const bodyParser = require('body-parser');
const Router = require('express-promise-router');
const app = express();
const router = new Router();
app.use(bodyParser.json());

// postgress
const { Pool } = require('pg');
const connectionString = process.env.DB_CONNECTION_STRING;
const pool = new Pool({ connectionString });
const query = (text, params) => pool.query(text, params);

app.post('/api/survey-data/add', async (req, res) => {
  const { surveyData } = req.body;
  try {
    const { rows } = await query(
      'INSERT INTO orders (survey_data) VALUES ($1) RETURNING id',
      [JSON.stringify(surveyData)],
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
    const { rows } = await query('SELECT survey_data, created_at FROM orders ORDER by id desc LIMIT 1');
    res.send(rows[0]);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get('/api/survey-data/:id', async (req, res) => {
  const {id} = req.params;
  try {
    const { rows } = await query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]);
    res.send(rows[0]);
  } catch (e) {
    res.status(500).send(e);
  }
});


const server = app.listen(8080, () => {
  console.log('server started on: ', server.address().port);
});
