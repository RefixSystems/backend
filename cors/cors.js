const corsOptions = {
    origin: "*",
    methods: "GET, POST, PUT, PATCH, DELETE",
    allowedHeaders: 'Content-type, Authorization' 
};

module.exports = corsOptions;