const { MongoDB, MongoClient } = require('mongodb');
const { Telegraf } = require('telegraf');

//Database stuff
var url = "mongodb://localhost:27017/";

//Dont share this key
const key = require("./.secret/key.json");
const bot = new Telegraf(key.key);

//try /start in the bot's dms
bot.start((ctx) => ctx.reply('Welcome!'));

bot.command('upload', (ctx) => {
    if (ctx.from.id != "399871144") {
        ctx.reply("I'm sorry John");
        return;
    }

    var link = ctx.message.text.split(' ')[1];

    var client = new MongoClient(url);

    client.connect((err, db) => {
        if (err) throw err;
        var dbo = db.db("Telegram_Test_DB");
        var pisspic = { url: link };
        dbo.collection("Piss").insertOne(pisspic);
        db.close();
    });
    
    ctx.reply("Received!")

});

//Start the bot with a little message
bot.launch().then((o, e) => {
    console.log("Starting bot...");
});




