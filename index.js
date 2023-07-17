const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion,ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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

const verifyJWT = (req, res, next) => {
  
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
  

    const toysCollection = client.db("ToysStore").collection("AllToys");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res.send({ token });
    });


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

      app.get("/mytoys", verifyJWT, async (req, res) => {

   
       const decoded=req.decoded;
      
       if(decoded.email!==req.query.email)
       {
           return res.status(403).send({error:1,message:'forbidden access'})
       }
        let query = {};
        if (req.query?.email) {
          query = { selleremail: req.query.email };
        }
  
        const result = await toysCollection.find(query).toArray();
        res.send(result);
      });

      app.post("/mytoys", verifyJWT, async (req, res) => {
        
        const decoded=req.decoded;
        
        if(decoded.email!==req.query.email)
        {
            return res.status(403).send({error:1,message:'forbidden access'})
        }
        const {text}=req.body
        let query = {};
        if (req.query?.email) {
          query = { selleremail: req.query.email };
        }
        if(text=="Lowest to Highest"){
            const result = await toysCollection.find(query).sort({price:1}).collation({locale: "en_US", numericOrdering: true}).toArray();
            res.send(result);
        }
        else if(text=="Highest to Lowest"){
          const result = await toysCollection.find(query).sort({price:-1}).collation({locale: "en_US", numericOrdering: true}).toArray();
          res.send(result);
        }
        else if(text=="Default Price")
        {
          const result =await  toysCollection.find(query).toArray()
          res.send(result)
        }
  
       
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

       app.delete('/toydelete/:id',async(req,res)=>{
        const id=req.params.id
        const query={_id: new ObjectId(id)}

        const result=await toysCollection.deleteOne(query)
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