const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const cookieParser = require("cookie-parser");

// firebase admine SDk
const decoded = Buffer.from(process.env.FIRE_BASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// set midelwear
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
// app.use(cookieParser());

const logger = (req, res, next) => {
  console.log("This is Midelwier of Accesstoken");
  next();
};

// bides one Apis
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  try {
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.oner_email = decodedUser.email;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).send({ message: "Unauthorized access" });
  }
};

// jwt tokens verify
const chackTokens = async (req, res, next) => {
  if (!req.headers.author) {
    return res.status(401).send({ message: "unother access" });
  }
  const tokens = req.headers.author.split(" ")[1];
  if (!tokens) {
    return res.status(401).send({ message: "unother access" });
  }
  jwt.verify(tokens, process.env.JWT_SECTIGHT, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unouthroize users" });
    }
    req.oner_email = decoded.email;
    next();
  });
};

// axios apis midelwear
const axiosVerifyUser = async (req, res, next) => {
  const authorizationwd = req.headers.authorization;
  if (!authorizationwd) {
    return res.status(401).send({ message: "Unother Accesss" });
  }
  const tokens = authorizationwd.split(" ")[1];

  try {
    const verify = await admin.auth().verifyIdToken(tokens);
    req.verify_email = verify.email;
    console.log(verify);
    next();
  } catch {
    return res.status(401).send({ message: "Unother Accesss" });
  }
};

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

    // creat coustom JWT Tokens
    app.post("/jseonToken", (req, res) => {
      const myUser = req.body;
      const token = jwt.sign(myUser, process.env.JWT_SECTIGHT, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // userApi
    app.get("/user", async (req, res) => {
      const data = myUser.find();
      const result = await data.toArray();
      res.send(result);
      console.log(result);
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
      const query = {};
      if (req.query.email) {
        query.email = req.query.email;
      }
      const data = myCollection.find(query);
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

    app.get("/producat/bids/:id", async (req, res) => {
      const producatId = req.params.id;
      const coursor = { producatIDS: producatId };
      const query = myBids.find(coursor).sort({ bid_price: 1 });
      const result = await query.toArray();
      res.send(result);
    });

    // post producat
    app.post("/producat", axiosVerifyUser, async (req, res) => {
      console.log("this is axios request", req.verify_email);

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
    // app.get("/bids", logger, verifyFirebaseToken, async (req, res) => {
    //   const query = {};
    //   if (req.query.email) {

    //     // login user email chack
    //     if (req.query.email !== req.oner_email) {
    //       return res.status(403).send({ message: "firebase access denides" });
    //     }

    //     query.byer_email = req.query.email;
    //   }
    //   const coursor = myBids.find(query).sort({ bid_price: 1 });
    //   const result = await coursor.toArray();

    //   res.send(result);
    // });

    app.get("/bids", verifyFirebaseToken, async (req, res) => {
      const query = {};
      if (req.query.email) {
        query.byer_email = req.query.email;
      }
      if (req.query.email !== req.oner_email) {
        return res.status(403).send({ message: "Not  access real user" });
      }
      const coursor = myBids.find(query);
      const result = await coursor.toArray();
      res.send(result);
    });

    app.post("/bids", async (req, res) => {
      const data = req.body;
      const result = await myBids.insertOne(data);
      res.send(result);
      console.log(result);
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

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
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
