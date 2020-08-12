const { MongoDB, MongoClient } = require('mongodb');
const { Telegraf } = require('telegraf');
const { CronJob } = require('cron');
const Logger = require('./logging');

//Database stuff
var url = "mongodb://localhost:27017/";

//Dont share this key
const key = require("./.secret/key.json");
const logging = require('./logging');
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
        Logger.warn("Unauthorized use of bot");
        return;
    }

    //basic message filtering
    var link = ctx.message.text.split(' ')[1];

    //adding record to database
    var client = new MongoClient(url);

    client.connect((err, db) => {
        if (err) throw err;
        var dbo = db.db("Telegram_DB");
        var pisspic = { url: link };
        dbo.collection("Piss").insertOne(pisspic);
        db.close();
    });
    
    //confirming database recieved
    ctx.reply("Received!");
    Logger.log('New record added');

});

//command for uploading many records
bot.command('uploadmany', (ctx) => {

    //just incase anyone but me tries anything wack
    if (ctx.from.id != key.User_ID) {
        ctx.reply("I'm sorry John");
        Logger.warn("Unauthorized use of bot");
        return;
    }

    //basic message filtering
    var links = ctx.message.text.split('\n');
    links.shift();
    console.log(links);

    //adding record to database
    var client = new MongoClient(url);

    var pisspics = [];
    var recordCount = 0;
        
    links.forEach(link => {
        pisspics.push({ url: link });
        recordCount++;
    })

    client.connect((err, db) => {
        if (err) throw err;
        var dbo = db.db("Telegram_DB");

        dbo.collection("Piss").insertMany(pisspics);
        db.close();
    });
    
    //confirming database recieved
    ctx.reply("Received!");
    Logger.log('New records added - ' + recordCount);

});

//Cron job task scheduler
var job = new CronJob('*/1 * * * *', function() {

    //connecting to database
    var client = new MongoClient(url);

    //basic connection
    client.connect(async (err, db) => {
        if (err) throw err;
        var dbo = db.db("Telegram_DB");

        //finding records to post
        var topost = await dbo.collection("Piss").find().sort({_id:1}).limit(2);

        var recordcount = await topost.count();
        
        if(recordcount > 0) {

            //send messages
            topost.forEach((o,e) => {
                Logger.log("Link posted - " + o.url);
                bot.telegram.sendMessage(key.Chat_ID, o.url);
            });

            //deleting records after posting
            await dbo.collection("Piss").deleteOne({});
            await dbo.collection("Piss").deleteOne({});
            Logger.log("records deleted");
        } else {
            Logger.warn("DB empty, not posting")
        }

        
        await db.close();
    });
}, null, true, 'Australia/Sydney');


//Start the bot with a little message
bot.launch().then((o, e) => {
    Logger.log("Starting bot...");
    job.start();
});




