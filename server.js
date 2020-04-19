// server.js

const express = require ('express');
const app = express ();

app.listen(3000, function(){
      console.log('lisening on 3000')
})

app.get('/', (req, res) => {
    res.send("ttt")
})
