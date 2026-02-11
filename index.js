const express = require("express");
const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(express.json());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 3000;

let banco = {};
if (fs.existsSync("banco.json")) {
  banco = JSON.parse(fs.readFileSync("banco.json"));
}

function salvar() {
  fs.writeFileSync("banco.json", JSON.stringify(banco, null, 2));
}

client.once("ready", () => {
  console.log("Banco 2LCoins online");
});

client.login(TOKEN);

app.post("/getsaldos", (req, res) => {
  const roblox = req.body.roblox;
  for (let id in banco) {
    if (banco[id].roblox === roblox) {
      return res.json(banco[id]);
    }
  }
  res.json({ real: 0, dolar: 0, vip: false });
});

app.post("/debitar", (req, res) => {
  const { roblox, tipo, valor } = req.body;
  for (let id in banco) {
    if (banco[id].roblox === roblox) {
      banco[id][tipo] -= valor;
      salvar();
      return res.json({ ok: true });
    }
  }
  res.json({ ok: false });
});

app.listen(PORT, () => {
  console.log("API online");
});
