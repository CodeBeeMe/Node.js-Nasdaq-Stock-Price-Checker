
const Alpha = require('alpha_vantage_api_wrapper').Alpha;
const apiKey = process.env.API_KEY; //my api user unique key
const alpha = new Alpha(apiKey);

function compareHandler (db, stock1, stock2, like, ip, res) {
  //getting the stock data from the alphavantage API
  alpha.stocks.quote(stock1, {"datatype": "json"})//=================1st Stock==================
    .then((data) => {
    // Do what you want with the data
    const code = data["Global Quote"]["01. symbol"] //getting the stock code from the data obj
    const value = data["Global Quote"]["05. price"]; //getting the price value from the data obj    
    
    let stockOneApiData = { code: code, value: value }; //getting the data props from the first stock query   
    
    alpha.stocks.quote(stock2, {"datatype": "json"})//=================2nd Stock=================
      .then((data) => {
      // Do what you want with the data
      const code = data["Global Quote"]["01. symbol"] //getting the stock code from the data obj
      const value = data["Global Quote"]["05. price"]; //getting the price value from the data obj
      
      let stockTwoApiData = { code: code, value: value }; //getting the data props from the second stock query      
      
      //stockEntry array of stock objects
      const stockEntry = [
        { stock : stockOneApiData.code, price : stockOneApiData.value, likes : 0, like : like ? 1 : 0, ips : [] },
        { stock : stockTwoApiData.code, price : stockTwoApiData.value, likes : 0, like : like ? 1 : 0, ips : [] }
      ];
            
      if (stockEntry[0].stock !== undefined && stockEntry[1].stock !== undefined) {
        stockEntry.forEach( obj => {
          like ? ++obj.likes : obj.likes; //adding the likes on a stock object, depending on the checkbox input status 
          like ? obj.ips.push(ip) : obj.ips; //capturing the user's ip that issued the like - using it to ignore another like from that ip    
        });  
        
        //====================checking to see if the user has submitted a like from this ip =========================
        
        function checkUserIp (object, stock, apiData) {
          
          let ipExists = object.ips.filter(el => el === ip); 
          ipExists.length !== 0 ? ipExists = true : ipExists = false;
          //console.log(ipExists);   
          if (ipExists) { //user from this ip has already submitted a like
            db.collection("stocks").updateOne(
              { stock : stock },
              { $set : { price : apiData.value }}
            )
          } else {
            if (like) { //submit like and capture the user's ip in the ips array for later reference
              db.collection("stocks").updateOne(
                { stock : stock },
                { $push : { ips : ip }, $set : { price : apiData.value, likes: ++object.likes, like : like ? 1 : 0 }}
              )
            }
          }
        } 
        
        //===========================================================================================================
        
        db.collection("stocks").find({ stock: { $in: [ stock1, stock2 ] } }, { projection : {_id: 0}})
          .toArray((err, doc) => {
          if (err) {
            res.send(err);
          } else {
            //console.log(doc);
            if (doc.length != 0) { //at least one stock is already in the database
              if (doc[1] != undefined) { // both stocks are in the database --> proceed to test ip for each individual stock entry
                doc.forEach(obj => {
                  if (obj.stock === stock1) {
                    checkUserIp(obj, stock1, stockOneApiData); //calling the checkUserIp() function
                  } else if (obj.stock === stock2) {
                    checkUserIp(obj, stock2, stockTwoApiData); //calling the checkUserIp() function
                    err ? res.send(err) : res.send({
                      stockData : [
                        {
                          stock       : stockOneApiData.code,
                          price       : stockOneApiData.value,
                          rel_likes   : doc[0].likes - doc[1].likes
                        },
                        {
                          stock       : stockTwoApiData.code,
                          price       : stockTwoApiData.value,
                          rel_likes   : doc[1].likes - doc[0].likes
                        }
                      ]
                    });
                  }
                })
              } else { //one of the stocks is not in the database
                if (stock1 != doc[0].stock) { //1st stock is not in the DB proceed to add it to DB and send a response with the resulting stockData
                  db.collection("stocks")
                    .insertOne(stockEntry[0], (err, log) => {
                    err ? res.send(err) : res.send({
                      stockData : [
                        {
                          stock       : stockOneApiData.code,
                          price       : stockOneApiData.value,
                          rel_likes   : stockEntry[1].likes - doc[0].likes 
                        },
                        {
                          stock       : stockTwoApiData.code,
                          price       : stockTwoApiData.value,
                          rel_likes   : doc[0].likes - stockEntry[1].likes    
                        } 
                      ]
                    });
                  })
                } else { //2nd stock is not in the DB proceed to add it to DB and send a response with the resulting stockData
                  db.collection("stocks")
                    .insertOne(stockEntry[1], (err, log) => {
                    err ? res.send(err) : res.send({
                      stockData : [
                        {
                          stock       : stockOneApiData.code,
                          price       : stockOneApiData.value,
                          rel_likes   : doc[0].likes - stockEntry[1].likes
                        },
                        {
                          stock       : stockTwoApiData.code,
                          price       : stockTwoApiData.value,
                          rel_likes   : stockEntry[1].likes - doc[0].likes
                        }
                      ]
                    });
                  })
                } 
              }
            } else { //neither of the stocks are in the database so proceed to add the stockEntry array of objects with it's props to the db  
              db.collection("stocks")
                .insertMany(stockEntry, (err, log) => {
                err ? res.send(err) : res.send({
                  stockData : [
                    {
                      stock       : stockOneApiData.code,
                      price       : stockOneApiData.value,
                      rel_likes   : stockEntry[0].likes - stockEntry[1].likes
                    },
                    {
                      stock       : stockTwoApiData.code,
                      price       : stockTwoApiData.value,
                      rel_likes   : stockEntry[1].likes - stockEntry[0].likes
                    }
                  ]
                });
                //console.log( stock1 + ' and ' + stock2 + ' stocks has been successfully submitted into the database.');
                //console.log(log.ops);
              });
            }
          } 
        });
      } else {
        stockEntry[0].stock === undefined ? res.send(stock1 + ' stock not found! Please submit a correct stock code.') : res.send(stock2 + ' stock not found! Please submit a correct stock code.')
      }
    })
      .catch((err) => {
      // Handle the error
      res.send(err);
    })
  })
    .catch((err) => {
    // Handle the error
    res.send(err);
  })
}

module.exports = compareHandler;
