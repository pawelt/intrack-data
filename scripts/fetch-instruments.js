const INSTRUMENTS = [
  {
    name: "ODIN Eiendom D",
    isin: "NO0010748155",
    code: "NO0010748155.ODEIEND-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/en/product/fund/NO0010748155.ODEIEND-WOMF",
  },
  {
    name: "DNB Teknologi N",
    isin: "NO0010801913",
    code: "NO0010801913.DKDNBTN-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/en/product/fund/NO0010801913.DKDNBTN-WOMF",
  },
  {
    name: "ODIN Sverige D",
    isin: "NO0010748304",
    code: "NO0010748304.ODSVERID-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/en/product/fund/NO0010748304.ODSVERID-WOMF",
  },
  {
    name: "ODIN Global D",
    isin: "NO0010732852",
    code: "NO0010732852.ODGLOBD-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/en/product/fund/NO0010732852.ODGLOBD-WOMF",
  },
  {
    name: "ODIN USA D",
    isin: "NO0010775729",
    code: "NO0010775729.ODODUSD-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/en/product/fund/NO0010775729.ODODUSD-WOMF",
  },
  {
    name: "DNB USA Indeks N",
    isin: "NO0010801954",
    code: "NO0010801954.DKUSAIN-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/en/product/fund/NO0010801954.DKUSAIN-WOMF",
  },
  {
    name: "DNB USA Indeks A",
    isin: "NO0010337959",
    code: "NO0010337959.DIUSA-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/nb/product/funds/NO0010337959.DIUSA-WOMF",
  },
  {
    name: "DNB Global Indeks N",
    isin: "NO0010827272",
    code: "NO0010827272.DKGLOIN-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/en/product/fund/NO0010827272.DKGLOIN-WOMF",
  },
  {
    name: "DNB Europa Indeks N",
    isin: "NO0010827926",
    code: "NO0010827926.DKEUINN-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/en/product/funds/NO0010827926.DKEUINN-WOMF",
  },
  {
    name: "DNB Norge Indeks N",
    isin: "NO0010827678",
    code: "NO0010827678.DKNOINN-WOMF",
    type: "ose-fund",
    page: "https://live.euronext.com/en/product/funds/NO0010827678.DKNOINN-WOMF",
  },
  {
    name: "KAHOOT! ASA",
    isin: "NO0010823131",
    code: "NO0010823131-MERK",
    type: "ose-stock",
    page: "https://live.euronext.com/en/product/equities/NO0010823131-MERK",
  },
];

const { writeFileSync } = require("fs");
const https = require('node:https');

const fetchData = (code, scope) => {
  return new Promise((resolve, reject) => {
    const url = `https://live.euronext.com/en/intraday_chart/getChartData/${code}/${scope}`;
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

const fetchMax = (code) => fetchData(code, "max");
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
    const [dataMax, dataRecent] = await Promise.all([
      fetchMax(ins.code),
      fetchRecent(ins.code),
    ]);
    //console.log(ins.name, dataMax.pop(), dataRecent.pop());

    // make sure the data is there and it's not []
    if (dataMax.length > 10) {
      writeFileSync(`data/${ins.isin}-max.json`, wrapData(dataMax, ins));
    } else {
      console.log(`Skipping MAX for ${ins.name}: fetched data too short`);
      console.log({ dataMax });
    }
    if (dataRecent.length > 10) {
      writeFileSync(`data/${ins.isin}-recent.json`, wrapData(dataRecent, ins));
    } else {
      console.log(`Skipping RECENT for ${ins.name}: fetched data too short`);
      console.log({ dataRecent });
    }
  } catch (err) {
    console.log(`Processing ${ins.name} failed: ` + err);
  }
};

const exportData = () => {
  INSTRUMENTS.forEach(processInstrument);
};

const exportToc = () => {
  console.log();

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
