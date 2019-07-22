/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb');
const stockHandler = require('../controllers/stockHandler.js');
const compareHandler = require('../controllers/compareHandler.js');

module.exports = (app, db) => {

  //=======================================================Stock-Prices==========================================================
  app.route('/api/stock-prices')  
    .get((req, res) => {
    const stock = req.query.stock.toUpperCase();
    const like = req.query.like;
    const ip = req.headers['x-forwarded-for'].split(",")[0]; //getting the user's ip   
    //console.log(ip);
    
    if(!stock) {
      res.send("*Stock code required! Example: 'GOOG'");
    } else {
      // calling the stockHandler function that handles the logic for creating, updating, retrieving stock data from the database
      stockHandler(db, stock, like, ip, res); //instantiating the stockHandler.js module
    }
  })
  
    .post(function (req, res){
    const stock = req.body.stock.toUpperCase();
    const like = req.body.like;    
    const ip = req.headers['x-forwarded-for'].split(",")[0]; //getting the user's ip     
    //console.log(ip);
    
    if(!stock) {
      res.send("*Stock code required! Example: 'GOOG'");
    } else {
      // calling the stockHandler function that handles the logic for creating, updating, retrieving stock data from the database
      stockHandler(db, stock, like, ip, res); //instantiating the stockHandler.js module
    }
  
  })
  
  //=======================================================Stock-Compare==========================================================
  
  app.route('/api/stock-compare')  
    .get((req, res) => {
    const stockOne = req.query.stock1.toUpperCase();
    const stockTwo = req.query.stock2.toUpperCase();
    const like = req.query.like;
    const ip = req.headers['x-forwarded-for'].split(",")[0]; //getting the user's ip   
    //console.log(ip);
    
    if(!stockOne || !stockTwo) {
      res.send("*Stock code required! Example: 'GOOG'");
    } else {
      // calling the compareHandler function that handles the logic for creating, updating, retrieving stock data from the database
      compareHandler (db, stockOne, stockTwo, like, ip, res); //instantiating the stockHandler.js module
    }
  })
  
    .post(function (req, res){
    const stockOne = req.body.stock1.toUpperCase();
    const stockTwo = req.body.stock2.toUpperCase();
    const like = req.body.like;    
    const ip = req.headers['x-forwarded-for'].split(",")[0]; //getting the user's ip     
    //console.log(ip);
    
    if(!stockOne || !stockTwo) {
      res.send("*Stock code required! Example: 'GOOG'");
    } else {
      // calling the compareHandler function that handles the logic for creating, updating, retrieving stock data from the database
      compareHandler (db, stockOne, stockTwo, like, ip, res); //instantiating the compareHandler.js module      
    }
    
  })
  
};
