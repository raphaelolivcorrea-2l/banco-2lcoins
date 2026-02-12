const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const express = require("express");
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const app = express();
app.use(express.json());

const TOKEN = process.env.DISCORD_TOKEN;
const ADMIN_ID = "1000868973707022417";

let banco = {};
if (fs.existsSync("banco.json")) {
  banco = JSON.parse(fs.readFileSync("banco.json"));
}

function salvar() {
  fs.writeFileSync("banco.json", JSON.stringify(banco, null, 2));
}

// ───── API Roblox ─────
app.post("/getsaldos", (req, res) => {
  const roblox = req.body.roblox;
  for (let id in banco) {
    if (banco[id].roblox === roblox) return res.json(banco[id]);
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

app.listen(process.env.PORT || 3000);

// ───── Discord Ready ─────
client.once("ready", async () => {
  console.log("Banco 2LCoins online");

  const commands = [
    new SlashCommandBuilder()
      .setName("vincular")
      .setDescription("Vincular seu Roblox")
      .addStringOption(o => o.setName("roblox").setDescription("Nome no Roblox").setRequired(true)),

    new SlashCommandBuilder()
      .setName("extrato")
      .setDescription("Ver seu saldo"),

    new SlashCommandBuilder()
      .setName("adm")
      .setDescription("Painel do administrador")
      .addStringOption(o => o.setName("acao").setDescription("adicionar, remover, desvincular").setRequired(true))
      .addUserOption(o => o.setName("alvo").setDescription("Usuário").setRequired(true))
      .addStringOption(o => o.setName("tipo").setDescription("real ou dolar").setRequired(false))
      .addIntegerOption(o => o.setName("valor").setDescription("Valor").setRequired(false))
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

// ───── Interações ─────
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const id = interaction.user.id;
  if (!banco[id]) banco[id] = { roblox: null, real: 0, dolar: 0, vip: false };

  if (interaction.commandName === "vincular") {
    banco[id].roblox = interaction.options.getString("roblox");
    salvar();
    return interaction.reply("🔗 Roblox vinculado com sucesso.");
  }

  if (interaction.commandName === "extrato") {
    const u = banco[id];
    return interaction.reply(
      `🎮 Roblox: ${u.roblox || "Não vinculado"}\n💰 Real: ${u.real}\n💎 Dólar: ${u.dolar}\n👑 VIP: ${u.vip ? "Sim" : "Não"}`
    );
  }

  if (interaction.commandName === "adm") {
    if (id !== ADMIN_ID) return interaction.reply("❌ Sem permissão.");

    const alvo = interaction.options.getUser("alvo").id;
    const acao = interaction.options.getString("acao");
    const tipo = interaction.options.getString("tipo");
    const valor = interaction.options.getInteger("valor");

    if (!banco[alvo]) banco[alvo] = { roblox: null, real: 0, dolar: 0, vip: false };

    if (acao === "desvincular") {
      banco[alvo].roblox = null;
      salvar();
      return interaction.reply("🔓 Conta desvinculada.");
    }

    if (acao === "adicionar") banco[alvo][tipo] += valor;
    if (acao === "remover") banco[alvo][tipo] -= valor;

    salvar();
    return interaction.reply("✅ Operação concluída.");
  }
});

client.login(TOKEN);
