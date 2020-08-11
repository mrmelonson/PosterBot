const { MongoDB, MongoClient } = require('mongodb');
const { Telegraf } = require('telegraf');
const { CronJob } = require('cron');

//Database stuff
var url = "mongodb://localhost:27017/";

//Dont share this key
const key = require("./.secret/key.json");
const bot = new Telegraf(key.key);

//try /start in the bot's dms
bot.start((ctx) => {
    ctx.reply(ctx.chat.id);
    //ctx.telegram.sendMessage("-472572071", "Hello World!");
});

//upload command
bot.command('upload', (ctx) => {

    //just incase anyone but me tries anything wack
    if (ctx.from.id != key.User_ID) {
        ctx.reply("I'm sorry John");
        console.log("Unauthorized use of bot");
        return;
    }

    //basic message filtering
    var link = ctx.message.text.split(' ')[1];

    //adding record to database
    var client = new MongoClient(url);

    client.connect((err, db) => {
        if (err) throw err;
        var dbo = db.db("Telegram_Test_DB");
        var pisspic = { url: link };
        dbo.collection("Piss").insertOne(pisspic);
        db.close();
    });
    
    //confirming database recieved
    ctx.reply("Received!");
    console.log('New record added');

});

//Cron job task scheduler
var job = new CronJob('*/1 * * * *', function() {

    //connecting to database
    var client = new MongoClient(url);

    //basic connection
    client.connect((err, db) => {
        if (err) throw err;
        var dbo = db.db("Telegram_DB");

        //finding records to post
        var topost = dbo.collection("Piss").find().sort({_id:1}).limit(2);

        topost.forEach((o,e) => {
            console.log("Link posted - " + o.url);
            bot.telegram.sendMessage(key.Chat_ID, o.url);
        });

        dbo.collection("Piss").deleteOne({});
        dbo.collection("Piss").deleteOne({});
        console.log("records deleted");


        //deleted records
        db.close();
    });
}, null, true, 'Australia/Sydney');


//Start the bot with a little message
bot.launch().then((o, e) => {
    console.log("Starting bot...");
    job.start();
});




