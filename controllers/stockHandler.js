
// replacing the FCC's proposed google.finance API, that has been DISCONTINUED in the meantime, with the fully working one stock exchange API: https://www.alphavantage.co 

const Alpha = require('alpha_vantage_api_wrapper').Alpha;
const apiKey = process.env.API_KEY; //my api user unique key
const alpha = new Alpha(apiKey);


function stockHandler (db, stock, like, ip, res) {
  //getting the stock data from the alphavantage API
  alpha.stocks.quote(stock, {"datatype": "json"})
    .then((data) => {
    // Do what you want with the data
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
          //testing to see if the user has given a like, by looking for it's ip entry in the stock object.ips array
          let ipExists = doc[0].ips.filter(el => el === ip); 
          ipExists.length !== 0 ? ipExists = true : ipExists = false;
          //console.log(ipExists);          
          if (ipExists) { //user from this ip has already submitted a like
            db.collection("stocks").updateOne(
              { stock : stock },
              { $set : { price : value }}
            )
          } else {
            if (like) { //submit like and capture the user's ip in the ips array for later reference
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
        } else { //the stock is not in the database so proceed to add a stockEntry object with it's props
          db.collection("stocks")
            .insertOne(stockEntry, (err, log) => {
            err ? res.send(err) : res.send({
              stockData : {
                stock   : code,
                price   : value,
                likes   : stockEntry.likes
              }
            });
            //console.log( stock.toUpperCase() + ' stock has been successfully submitted into the database.');
            //console.log(log.ops);
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

module.exports = stockHandler;
