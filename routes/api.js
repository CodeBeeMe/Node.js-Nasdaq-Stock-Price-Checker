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
// replacing the DISCONTINUED google.finance API with the fully working https://www.alphavantage.co stock exchange API
const Alpha = require('alpha_vantage_api_wrapper').Alpha 

const apiKey = process.env.API_KEY; //api user unique key
const alpha = new Alpha(apiKey);

module.exports = (app, db) => {

  app.route('/api/stock-prices')  
    .get((req, res) => {
    const stock = req.query.stock.toUpperCase();
    const like = req.query.like;
    
    if(!stock) {
      res.send("*Stock code required! Example: 'GOOG'");
    } else {
      db.collection("stocks").find({ stock : stock }, { projection : {_id : 0, like : 0, ips : 0 }})
        .toArray((err, doc) => {
        err ? res.send(err) : res.send({ 
          stockData : {
            stock   : stock,
            price   : doc[0].price,
            likes   : doc[0].likes
          }}
        );
      })
    }
  })
  
    .post(function (req, res){
    const stock = req.body.stock.toUpperCase();
    const like = req.body.like;    
    const ip = req.headers['x-forwarded-for'].split(",")[0]; //getting the user's ip    
    
    let count = 0;
    
    //console.log(ip);
    //console.log(req.headers);
    
    if(!stock) {
      res.send("*Stock code required! Example: 'GOOG'");
    } else {   
      alpha.stocks.quote(stock, {"datatype": "json"})
        .then((data) => {
        // Do what you want with the data
        //const code = Object.values(Object.values(data)[0])[0]; //getting the stock code from the data obj
        //const value = Object.values(Object.values(data)[0])[4]; //getting the price value from the data obj        
        const code = data["Global Quote"]["01. symbol"] //getting the stock code from the data obj
        const value = data["Global Quote"]["05. price"]; //getting the price value from the data obj
        
        //stockEntry object
        const stockEntry = {
          stock   : code,
          price   : value,
          likes   : 0,
          like    : like ? 1 : 0,
          ips     : []          
        }
        
        like ? ++stockEntry.likes : stockEntry.likes; //adding the likes on a stock object, depending on the checkbox input status 
        like ? stockEntry.ips.push(ip) : stockEntry.ips; //capturing the user's ip that issued the like - using it to ignore another like from that ip 
                
        db.collection("stocks").find({ stock : stock }, { projection : {_id: 0}})
          .toArray((err, doc) => {
          if (err) {
            res.send(err);            
          } else {
            if (doc[0] != undefined) { //the stock is already in the database --> proceed to update its props                          
              let ipExists = doc[0].ips.filter(el => el === ip);
              ipExists.length !== 0 ? ipExists = true : ipExists = false;
              console.log(ipExists);
              
              if (ipExists) {
                db.collection("stocks").updateOne(
                  { stock : stock },
                  {$set : { price : value }}
                )
              } else {
                if (like) {
                  db.collection("stocks").updateOne(
                    { stock : stock },
                    { $push : { ips : ip }, $set : { price : value, likes: ++doc[0].likes, like : like ? 1 : 0 }}
                  )
                }
              }                         
              err ? res.send(err) : res.send({
                stockData : {
                  stock   : code,
                  price   : value,
                  likes   : doc[0].likes
                }
              });
            } else {
              db.collection("stocks")
              .insertOne(stockEntry, (err, log) => {    
                err ? res.send(err) : res.send({
                  stockData : {
                    stock   : code,
                    price   : value,
                    likes   : stockEntry.likes
                  }
                });
                console.log('Stock ' + stock.toUpperCase() + ' has been successfully submitted into the database.');
                console.log(log.ops);
              });
            }
          }          
        });        
      })
        .catch((err) => {
        // Handle the error
        res.send(err);
      })
    }
  
  })

};
