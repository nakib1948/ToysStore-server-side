const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion,ObjectId } = require("mongodb");

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qxayaa3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toysCollection = client.db("ToysStore").collection("AllToys");

    app.get("/alltoys", async (req, res) => {
        const cursor = toysCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      });

      app.get('/toydetails/:id',async(req,res)=>{
        const id=req.params.id;
        const query = {_id:new ObjectId(id)}
        const user=await toysCollection.findOne(query);
        res.send(user)
       })

       app.post("/addtoy", async (req, res) => {
        const newtoy = req.body;
        const result = await toysCollection.insertOne(newtoy);
        res.send(result);
      });

      app.get("/mytoys", async (req, res) => {
      
        let query = {};
        if (req.query?.email) {
          query = { selleremail: req.query.email };
        }
  
        const result = await toysCollection.find(query).toArray();
        res.send(result);
      });

      app.put('/updatetoy/:id',async(req,res)=>{
        const id=req.params.id
       
        const toy=req.body
        const filter={_id:new ObjectId(id)}
        const options={upsert:true}
        const updatedToy={
          $set:{
            Name:toy.Name,
            pictureurl:toy.pictureurl,
            SellerName:toy.SellerName,
            selleremail:toy.selleremail,
            price:toy.price,
            rating:toy.rating,
            quantity:toy.quantity,
            subcategory:toy.subcategory,
            description:toy.description

          }
        }
        const result=await toysCollection.updateOne(filter,updatedToy,options)
        res.send(result)
    
       })



    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
   
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Simple curd is running");
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});