const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config()


// set midelwear
app.use(cors());
app.use(express.json());

// const uri =
//   "mongodb+srv://SmartDealsUser:nbOJwLkt8IV5LCGW@clustermyfirstmongodbpr.2cecfoe.mongodb.net/?appName=ClusterMyFirstMongoDbProject";
const uri =
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@clustermyfirstmongodbpr.2cecfoe.mongodb.net/?appName=ClusterMyFirstMongoDbProject`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Hi This is my Smart Deals server");
});

async function run() {
  try {
    await client.connect();
    const myDb = client.db("smart_dealsDB");
    const myCollection = myDb.collection("smartDeals");
    const myBids = myDb.collection("bids");
    const myUser = myDb.collection("user");

    // userApi
    app.get("/user", async (req, res) => {
      const data = myUser.find();
      const result = await data.toArray();
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const request = req.body;
      const email = req.body.email;
      const query = { email: email };
      const exgistingUser = await myUser.findOne(query);
      if (exgistingUser) {
        res.send({ message: "This User Allready Login" });
      } else {
        const result = await myUser.insertOne(request);
        res.send(result);
        console.log(request);
      }
    });

    app.patch("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      const seter = {
        $set: data,
      };
      const result = await myUser.updateOne(query, seter);
      res.send(result);
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myUser.deleteOne(query);
      res.send(result);
    });

    // producat limet APIS
    app.get("/limet-producat", async (req, res) => {
      const coursor = myCollection.find().sort({ created_at: 1 }).limit(10);
      const result = await coursor.toArray();
      res.send(result);
    });

    // ProducatgetAll
    app.get("/producat", async (req, res) => {
      //   const projectFild = { title: 1, price_min: 1, price_max: 1, image: 1 };
      //   const data = myCollection.find().sort({ price_min: -1 }).skip(2).limit(6).project(projectFild);

      const email = req.query.email;
      console.log(email);
      const point = {};
      if (email) {
        point.email = email;
      }
      const data = myCollection.find(point);
      const result = await data.toArray();
      res.send(result);
    });
    // getOne id
    app.get("/producat/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myCollection.findOne(query);
      res.send(result);
      console.log("Searching for:", id);
      console.log("Query result:", result);
    });

    app.get("/producat/bids/:id", async (req, res) => {
      const producatId = req.params.id;
      const coursor = { producatIDS: producatId };
      const query = myBids.find(coursor).sort({ bid_price: 1 });
      const result = await query.toArray();
      res.send(result);
    });

    // post
    app.post("/producat", async (req, res) => {
      const data = req.body;
      const result = await myCollection.insertOne(data);
      res.send(result);
    });

    // updeatNow
    app.patch("/producat/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      const seter = {
        $set: data,
      };

      const result = await myCollection.updateOne(query, seter);
      res.send(result);
    });

    // delete
    app.delete("/producat/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myCollection.deleteOne(query);
      res.send(result);
    });

    // bids relatieat API
    app.get("/bids", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.buyer_email = email;
      }
      const data = myBids.find(query);
      const result = await data.toArray();
      res.send(result);
      console.log(email);
    });

   app.get("/bids", async (req, res) => {
  const byer_email = req.query.byer_email; // <-- same name
  const query = {};

  if (byer_email) {
    query.byer_email = byer_email; // <-- match field name in DB
  }

  const result = await myBids.find(query).toArray();
  res.send(result);
});


    app.post("/bids", async (req, res) => {
      const data = req.body;
      const result = await myBids.insertOne(data);
      res.send(result);
    });

    app.patch("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      const seter = {
        $set: data,
      };

      const result = await myBids.updateOne(query, seter);
      res.send(result);
    });

    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myBids.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`My smart deals server running port : ${port}`);
});

// ai vabe o kora jey
// client.connect()
// .then(() => {
//     app.listen(port, () => {
//     console.log(`My smart deals server running port : ${port}`)
// })
// })
