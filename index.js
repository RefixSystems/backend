const express = require('express');
const connectDB = require('./config/db');
const cors = require("cors");
const corsOptions = require('./cors/cors');
const app = express();
const port = process.env.PORT || 3001;
const adminController = require('./controllers/admin');
const serviceController = require('./controllers/service');
const userController = require('./controllers/user');
connectDB();

app.use(express.json());
app.use(cors(corsOptions));
app.use("/admin", adminController);
app.use("/service", serviceController);
app.use("/user", userController);

app.get("/", async(req, res) => {
    res.status(200).send(`Server setup done for "The Laptop Doctor!"`)
});

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
}); 