const express = require('express');
const fs = require('fs');
const https = require('https');
const http = require('http');
const connectDB = require('./config/db');
const cors = require("cors");
const corsOptions = require('./cors/cors');
const adminController = require('./controllers/admin');
const serviceController = require('./controllers/service');
const userController = require('./controllers/user');

const app = express();
const port = process.env.PORT || 3001;

connectDB();

app.use(express.json());
app.use(cors(corsOptions));
app.use("/admin", adminController);
app.use("/service", serviceController);
app.use("/user", userController);

app.get("/", async (req, res) => {
    res.status(200).send(`Server setup done for "The Laptop Doctor!"`);
});

const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/refixsystems.com/privkey.pem'),  
    cert: fs.readFileSync('/etc/letsencrypt/live/refixsystems.com/fullchain.pem') 
};

https.createServer(sslOptions, app).listen(443, () => {
    console.log('HTTPS server running on port 443');
});

http.createServer((req, res) => {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80, () => {
    console.log('HTTP server running on port 80 and redirecting to HTTPS');
});

// Start your app on the specified port for development (optional)
app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});


// const express = require('express');
// const connectDB = require('./config/db');
// const cors = require("cors");
// const corsOptions = require('./cors/cors');
// const app = express();
// const port = process.env.PORT || 3001;
// const adminController = require('./controllers/admin');
// const serviceController = require('./controllers/service');
// const userController = require('./controllers/user');
// connectDB();

// app.use(express.json());
// app.use(cors(corsOptions));
// app.use("/admin", adminController);
// app.use("/service", serviceController);
// app.use("/user", userController);

// app.get("/", async(req, res) => {
//     res.status(200).send(`Server setup done for "The Laptop Doctor!"`)
// });

// app.listen(port, () => {
//     console.log(`Server is running on ${port}`);
// }); 