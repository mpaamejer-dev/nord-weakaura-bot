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

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('raidpacks')
      .setDescription('Post private WeakAura download buttons')
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
    console.log('Slash command /raidpacks registered.');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== 'raidpacks') return;

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

      await interaction.reply({
        content: 'Click a button to get your private .txt file.',
        components: [row],
      });

      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'download_kara') {
        const fileBuffer = await getFileBuffer('kara.txt');

        await interaction.reply({
          content: 'Here is your Kara WeakAura file.',
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
          content: 'Here is your Tier 4 WeakAura file.',
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
        content: 'Unknown button.',
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Something went wrong.',
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
