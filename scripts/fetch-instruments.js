const { INSTRUMENTS } = require('./config.js');
const { decryptAesPayload } = require('./crypto-util.js');

const { writeFileSync } = require("fs");
const https = require('node:https');

const fetchData = (code, scope) => {
  return new Promise((resolve, reject) => {
    const url = `https://live.euronext.com/en/intraday_chart/getChartData/${code}/${scope}?${Date.now()}`;
    // console.log(url)
    https.get(url, (res) => {
      // console.log('statusCode:', res.statusCode);
      // console.log('headers:', res.headers);
      if (res.statusCode !== 200) {
        return resolve(new Error(`GET ${url} failed with status: ${res.statusCode}`))
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  })
};

// NOTE: we don't really care about max, it can be easily fetched when needed
// const fetchMax = (code) => fetchData(code, "max");
const fetchMax = (code) => Promise.resolve('');

const fetch1m = (code) => fetchData(code, "1m");
const fetchIntraday = (code) => fetchData(code, "intraday");

const wrapData = (data, ins) => {
  return `
{
  "date": "${new Date().toISOString()}",
  "name": "${ins.name}",
  "page": "${ins.page}",
  "data": ${data
    .replaceAll("},", "},\n    ")
    .replace("[", "[\n    ")
    .replace("]", "\n  ]")}
}
    `;
};

const processInstrument = async (ins) => {
  try {
    const isFund = ins.type.includes("fund");
    const fetchRecent = isFund ? fetch1m : fetchIntraday;
    const [dataMax = '', dataRecent = ''] = await Promise.all([
      fetchMax(ins.code).catch(() => '').then(decryptAesPayload),
      fetchRecent(ins.code).catch(() => '').then(decryptAesPayload),
    ]);
    //console.log(ins.name, dataMax.pop(), dataRecent.pop());

    // make sure the data is there and it's not []
    if (dataMax.length > 10) {
      writeFileSync(`data/${ins.isin}-max.json`, wrapData(dataMax, ins));
    } else {
      if (dataMax.length > 0)  {
        console.log(`Skipping MAX for ${ins.name}: fetched data too short`);
        console.log({ dataMax });
      }
    }
    if (dataRecent.length > 10) {
      writeFileSync(`data/${ins.isin}-recent.json`, wrapData(dataRecent, ins));
    } else {
      if (dataMax.length > 0)  {
        console.log(`Skipping RECENT for ${ins.name}: fetched data too short`);
        console.log({ dataRecent });
      }
    }
  } catch (err) {
    console.log(`Processing ${ins.name} failed: ` + err);
  }
};

const exportData = () => {
  INSTRUMENTS.forEach(processInstrument);
};

const exportToc = () => {
  const baseUrl =
    "https://raw.githubusercontent.com/pawelt/intrack-data/master/data/";

  const toc = INSTRUMENTS.map(
    (ins) => `${ins.name.padEnd(20)}
  ${baseUrl}${ins.isin}-max.json
  ${baseUrl}${ins.isin}-recent.json
`
  ).join("\n");

  writeFileSync("toc.txt", toc);
};

exportToc();
exportData();
