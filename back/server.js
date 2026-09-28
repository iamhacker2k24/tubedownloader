const express = require("express")
require('dotenv').config();
const fs = require('fs');     
const cors = require("cors");
const getInfo = require("./DonloadLogic/Download_algo");
const app = express();
app.use(express.json())


app.use(cors())


//creating cookies for youtube 

if (process.env.YT_COOKIES_BASE64) {
    const cookiesContent = Buffer.from(process.env.YT_COOKIES_BASE64, 'base64').toString('utf-8');
    fs.writeFileSync('./yt_cookies.txt', cookiesContent);
    console.log('yt_cookies.txt created successfully');
}


app.get('/debug-cookies', (req, res) => {
    try {
        const content = fs.readFileSync('./yt_cookies.txt', 'utf-8');
        res.json({
            length: content.length,
            firstLine: content.split('\n')[0],
            lineCount: content.split('\n').length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get("/videourlget", async (req, res) => {
    const url = req.query.url;
    console.log(url);
    if (url) {
        const response = await getInfo(url)
        // console.log(response)
        res.status(200).json(response)
    }

    else {
        res.status(400).json({
            message: "pls sent a link "
        })
    }
})
app.get("/", (req, res) => {
    res.send("server working perfectly ")
})
app.listen(3000, () => {
    console.log("Server started");

})