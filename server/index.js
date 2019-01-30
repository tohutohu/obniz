const Obniz = require("obniz");
const request = require('request')
const path = require('path')
const {createCanvas} = require('canvas')
const { CanvasRenderService } = require('chartjs-node-canvas')

const mysql = require('mysql');
require('dotenv').config(path.resolve(__dirname, '../'))

const connection = mysql.createConnection({
  host     : process.env.MYSQL_HOSTNAME,
  user     : process.env.MYSQL_USERNAME,
  password : process.env.MYSQL_PASSWORD,
  database : process.env.MYSQL_DBNAME
});

connection.connect(err => {
  if(err) {
    console.log('mysql connection error')
    console.log(err)
    process.exit()
  }
});

connection.query(`
CREATE TABLE IF NOT EXISTS tempareture (
  id INT(11) NOT NULL auto_increment PRIMARY KEY,
  tempareture FLOAT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) `)

const getCurrentWheatherData = () => {
  return new Promise((resolve, reject) => {
    request('https://api.openweathermap.org/data/2.5/weather?q=Tokyo&APPID=' + process.env.WHEATHER_API_KEY, (err, res, data) => {
      resolve(JSON.parse(data))
    })
  })
}

const obniz = new Obniz("8455-7791");


obniz.onconnect = async function () {
  // Javascript Example
  const tempsens = obniz.wired("LM35DZ",  { gnd:0 , output:1, vcc:2});
  const led = obniz.wired("LED", {anode:3, cathode:4})

  setInterval(async () => {
    const temp = await tempsens.getWait();
    console.log(temp);
    const wheatherData = await getCurrentWheatherData()
    connection.query(`INSERT INTO tempareture (tempareture) VALUES (?)`, [temp])

    if (wheatherData.rain && wheatherData.rain['3h'] && wheatherData.rain['3h'] > 1) {
      led.blink(500)
    } else {
      led.off()
    }
  }, 10 * 1000)
}


