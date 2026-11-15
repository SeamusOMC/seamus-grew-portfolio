const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 8080;

app.use(compression());

// Serve the production build
app.use(express.static(path.resolve(__dirname, '../public')));

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
