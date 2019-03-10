const express = require('express');
const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;

const config = require('./config/services.json');

const app = express();

/*
ESTO ES PARA QUE EL JSON ENVIADO EN EL BODY ESTE ACCESSIBLE
SE CONOCE COMO MIDDLEWARE Y SIRVEN PARA PARSEAR Y TRABAJAR MEJOR CON LAS PETICIONES
HTTP
app.use(express.json())
*/
app.use(express.json())

const client = new mongoClient(`${config.mongo.url}:${config.mongo.port}`, {
  useNewUrlParser: true
});

// Use connect method to connect to the Server
const connectToMongoPromise = client.connect()
const initServerPromise = app.listen(config.express.port)

//https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Promise/all
Promise.all([connectToMongoPromise, initServerPromise]).then(values => {
  console.log("Servicios preparados");
  console.log("Serivor escuchando en el puerto:" + config.express.port);
}).catch(reason => {
  console.log("Error");
});


app.post('/product', function(req, res) {
  const productJson = req.body; //El producto se envia en el BODY
  /*Ejemplo:
  {
	"name":"arroz",
	"price":12,
	"category":"comestibles"
  }
  */

  const database = client.db(config.mongo.database);
  const productsCollection = database.collection('products');

  productsCollection.insertOne(productJson).then(response => {
    if (response.insertedCount != 0) {
      res.status(200).send("Producto agregado correctamente");
    } else {
      res.status(400).send("Error al agregar el producto");
    }
  }).catch(error => {
    res.status(400).send("Error al agregar el producto");
  })
});



app.get('/products', function(req, res) {

  const database = client.db(config.mongo.database);
  const productsCollection = database.collection('products');

  return productsCollection.find({}).toArray().then(products => {
    console.log("Found the following products");
    console.log(products)
    res.status(200).send(products)
  }).catch(err => {
    console.log(err)
    res.status(400).send("Error")
  })
});

app.get('/product/:productId', function(req, res) {

  const productId = req.params.productId;

  const database = client.db(config.mongo.database);
  const productsCollection = database.collection('products');

  return productsCollection.find({
    _id: new mongodb.ObjectID(productId)
  }).toArray().then(products => {
    res.status(200).send(products[0])
  }).catch(err => {
    console.log(err)
    res.status(400).send("Error")
  })
});


app.delete('/product/:productId', function(req, res) {
  const productId = req.params.productId

  const database = client.db(config.mongo.database);
  const productsCollection = database.collection('products');

  try {
    productsCollection.deleteOne({
      _id: new mongodb.ObjectID(productId)
    }).then(response => {
      throw "myException";
      if (response.deletedCount > 0) {
        res.status(200).send("Product deleted")
      } else {
        res.status(404).send("Not found")
      }
    }).catch(err => {
      res.status(500).send("Error")
    })
  } catch (exception) {
    //Si por alguna razon el codigo que elimina un producto tiene un error desconocido
    //capturamos la exception con el try... catch
    res.status(500).send(exception)
  }



});


// Insert multiple documents
/*CON CALLBACK
db.collection('products').insertMany([{a:2}, {a:3}], function(err, response) {
      assert.equal(null, err);
      assert.equal(2, response.insertedCount);
      client.close();
    });
 */
/*CON PROMISE
db.collection('products').insertMany([{a:2}, {a:3}],{wtimeout:400}).then(response=>{
  console.log(response)
  if(response.insertedCount==2){
  //Se insertaron correctamente
}
}).catch(error){
console.log(error)
}


, function(err, r) {
      assert.equal(null, err);
      assert.equal(2, r.insertedCount);

      client.close();
    });
 */

/*
const now = moment();

await collection.insertMany([{
  datetime: now.format()
}])
console.log("Inserted");
client.close();
*/