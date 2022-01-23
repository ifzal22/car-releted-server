const express = require("express");
const cors = require("cors");
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pqdph.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

console.log(uri)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


// firebase-admin-sdk.json




const serviceAccount = require("./firebase-admin-sdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});





const app = express();
const port =  process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}


// FUNTION
async function run(){
    try{
    await client.connect();
    console.log('DATABASE CONNECTED SUCCESFULL')
    const database = client.db("cars-server");
    const servicesCollection = database.collection("all-car-show");
    const BookingCollection = database.collection('booking');
    const usersCollection = database.collection('users');
    const reviewCollection = database.collection('review');

    // GET API

    app.get("/AllCars", async(req,res) =>{
   
        const cursor = servicesCollection.find({});
        console.log(cursor)
        const services = await cursor.toArray();
        // console.log(services)
        res.send(services);
      })


      app.post('/addCars', async(req, res)=>{
        const service = req.body;
    //    console.log('hit the post api', service);
      
      
      const result = await servicesCollection.insertOne(service)
      console.log(result);
      res.json(result)
      })

      // get single package
      app.get("/AllCars/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await servicesCollection.findOne(query);
        res.json(result);
    });


    // Booking post
    app.post('/booking', async (req, res) => {
        const appointment = req.body;
        const result = await BookingCollection.insertOne(appointment);
        
        console.log(result);
        res.json(result)
    });

// review post

app.post('/review', async (req, res) => {
    const appointment = req.body;
    const result = await reviewCollection.insertOne(appointment);
    
    console.log(result);
    res.json(result)
});


// review get
app.get("/review", async(req,res) =>{
   
    const cursor = reviewCollection.find({});

    const services = await cursor.toArray();
    console.log(services)
    // console.log(services)
    res.send(services);
  })

    // BOOKING GET
    app.get("/myBooking/:email", async (req, res) => {
        const result = await BookingCollection.find({ email: req.params.email }).toArray();
        // console.log(result)
        res.json(result);
    });
// ALL BOKKING

    app.get("/AllBooking", async(req,res) =>{
   
        const cursor = BookingCollection.find({});
        // console.log(cursor)
        const services = await cursor.toArray();
        console.log(services)
        res.send(services);
      })


// BOOKING DELETED
    app.delete("/deleteMYBooking/:id", async (req, res) => {
        const result = await BookingCollection.deleteOne({
            _id: ObjectId(req.params.id),
        });
        console.log(result)
        res.json(result);
    });
 //  update products
 app.put("/CnfirmOrder/:id", async (req, res) => {
    const id = req.params.id;
    console.log('id ',id)
    const filter = { _id: ObjectId(id) };
    const result = await BookingCollection.updateOne(filter, {
        $set: {
            status: "Confirmed",
        },
    });
    console.log(result)
    res.json(result);
});
// SAVE USER DATA

app.post('/users', async (req, res) => {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    console.log(result)
    console.log(result);
    res.json(result);
});

app.put('/users', async (req, res) => {
    const user = req.body;
    const filter = { email: user.email };
    const options = { upsert: true };
    const updateDoc = { $set: user };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    res.json(result);
});


// MAKE A ADMIN

app.put('/users/admin', verifyToken, async (req, res) => {
    const user = req.body;
    console.log(req.headers)
    const requester = req.decodedEmail;
    if (requester) {
        const requesterAccount = await usersCollection.findOne({ email: requester });
        if (requesterAccount.role === 'admin') {
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        }
    }
    else {
        res.status(403).json({ message: 'you do not have access to make admin' })
    }

})

app.get('/users/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    let isAdmin = false;
    if (user?.role === 'admin') {
        isAdmin = true;
    }
    res.json({ admin: isAdmin });
})

    }
    finally{
        // await client.close();
    }
    }
    
    run().catch(console.dir);



app.get("/",(req, res)=>{
    res.send("HEllow world");
});


app.listen(port, () =>{
    console.log("Running server port");
});
