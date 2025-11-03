const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

// firebase admine SDk
const serviceAccount = require("./firebase-admin-sdk.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// set midelwear
app.use(cors());
app.use(express.json());

const logger = (req, res, next) => {
  console.log("This is Midelwier of Accesstoken");
  next();
};


const verifyFirebaseToken = async (req, res, next) => {
  if (!req.headers.author) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = req.headers.author.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  try {
    const onerInformation = await admin.auth().verifyIdToken(token);
    req.oner_email = onerInformation.email;
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized access" });
  }
};

// const userEmailverify = async (req, res, next) => {
//   if (req.oner_email !== req.oner_email) {
//     return res.status(403).send({ message: "firebase access denides" });
//   }
//   next()
// };
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@clustermyfirstmongodbpr.2cecfoe.mongodb.net/?appName=ClusterMyFirstMongoDbProject`;

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
      const email = req.body.email;
      const query = { email: email };
      const exgistingUser = await myUser.findOne(query);

      const request = req.body;
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
    });

    app.get("/producat/bids/:id", verifyFirebaseToken, async (req, res) => {
      const producatId = req.params.id;
      const coursor = { producatIDS: producatId };
      const query = myBids.find(coursor).sort({ bid_price: -1 });
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
    //  Bids Email Match to return
    app.get("/bids", logger, verifyFirebaseToken, async (req, res) => {
      const query = {};
      if (req.query.email) {
        // login user email chack
        if (req.query.email !== req.oner_email) {
          return res.status(403).send({ message: "firebase access denides" });
        }

        query.byer_email = req.query.email;
      }
      const coursor = myBids.find(query).sort({ bid_price: 1 });
      const result = await coursor.toArray();

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
