const fs = require('node:fs/promises');
const path = require('node:path');
const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

function buildPanelRows() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('download_kara')
      .setLabel('Kara')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('download_tier4')
      .setLabel('Tier 4')
      .setStyle(ButtonStyle.Primary)
  );

  return [row];
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('postraidpacks')
      .setDescription('Post the raid pack panel as a bot message')
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
}

async function getFileBuffer(fileName) {
  const filePath = path.join(__dirname, 'files', fileName);
  return fs.readFile(filePath);
}

client.once(Events.ClientReady, async () => {
  try {
    await registerCommands();
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Slash command /postraidpacks registered.');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== 'postraidpacks') return;

      const panelChannel = await client.channels.fetch(process.env.PANEL_CHANNEL_ID);

      if (!panelChannel || !panelChannel.isTextBased()) {
        await interaction.reply({
          content: 'PANEL_CHANNEL_ID is invalid or not a text channel.',
          ephemeral: true,
        });
        return;
      }

      await panelChannel.send({
        content: '## Klik på knapperne herunder for at downloade Raid Pack WAs og få vist WA-filerne i .txt-format.',
        components: buildPanelRows(),
      });

      await interaction.reply({
        content: 'Raid pack panel posted.',
        ephemeral: true,
      });

      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'download_kara') {
        const fileBuffer = await getFileBuffer('kara.txt');

        await interaction.reply({
          content: 'Her er din Kara WeakAura-fil.',
          ephemeral: true,
          files: [
            {
              attachment: fileBuffer,
              name: 'kara.txt',
            },
          ],
        });
        return;
      }

      if (interaction.customId === 'download_tier4') {
        const fileBuffer = await getFileBuffer('tier4.txt');

        await interaction.reply({
          content: 'Her er din Tier 4 WeakAura-fil.',
          ephemeral: true,
          files: [
            {
              attachment: fileBuffer,
              name: 'tier4.txt',
            },
          ],
        });
        return;
      }

      await interaction.reply({
        content: 'Ukendt knap.',
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Noget gik galt.',
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
