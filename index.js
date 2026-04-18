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
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('download_kara')
      .setLabel('Kara')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('download_tier4')
      .setLabel('Tier 4')
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('download_dungeon1')
      .setLabel('Dungeon Pack 1/2')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('download_dungeon2')
      .setLabel('Dungeon Pack 2/2')
      .setStyle(ButtonStyle.Primary)
  );

  return [row1, row2];
}

function buildPanelContent() {
  return '## Guide til Raid & Dungeon Packs\n\n### __Raid Packs__\nFølg disse trin for at installere Fojji Raid Packs.\n\n1. Importér [Fojji\\\'s Raid Pack Classic](https://wago.io/FojjiRaidAnchors-Classic).\n2. Download den nyeste version af [FojjiCore](https://www.curseforge.com/wow/addons/fojjicore).\n3. Tryk på en af knapperne herunder for at få vist WeakAura-koden.\n4. Hent hele filen via "•••" i pop-up-beskeden, og vælg derefter "Download".\n   - Du kan ikke importere koden direkte fra pop-up-beskeden. Filen skal downloades først.\n5. Åbn filen i fx Notesblok, og kopiér indholdet ind i WeakAuras som import.\n6. Det kan tage et øjeblik, og spillet kan fryse. Det er normalt. Vent, til importen er færdig.\n7. Reload spillet med `/reload`.\n8. Du er nu klar.\n\n### __Dungeon Packs__\nFølg samme fremgangsmåde som ovenfor, men importér også [FojjiAPI Role TBC](https://wago.io/FojjiAPIRoleTBC).\n\n*Skriv, hvis du har brug for hjælp.*';
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('postraidpacks')
      .setDescription('Create or update the raid pack panel')
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

async function createOrUpdatePanel() {
  const panelChannel = await client.channels.fetch(process.env.PANEL_CHANNEL_ID);

  if (!panelChannel || !panelChannel.isTextBased()) {
    throw new Error('PANEL_CHANNEL_ID is invalid or not a text channel.');
  }

  const payload = {
    content: buildPanelContent(),
    components: buildPanelRows(),
  };

  const panelMessageId = process.env.PANEL_MESSAGE_ID;

  if (!panelMessageId) {
    const newMessage = await panelChannel.send(payload);
    console.log(`Created panel message. PANEL_MESSAGE_ID=${newMessage.id}`);
    return { action: 'created', messageId: newMessage.id };
  }

  try {
    const existingMessage = await panelChannel.messages.fetch(panelMessageId);
    await existingMessage.edit(payload);
    console.log(`Updated panel message. PANEL_MESSAGE_ID=${existingMessage.id}`);
    return { action: 'updated', messageId: existingMessage.id };
  } catch (error) {
    const newMessage = await panelChannel.send(payload);
    console.log(`Old panel not found. Created new panel message. PANEL_MESSAGE_ID=${newMessage.id}`);
    return { action: 'created', messageId: newMessage.id };
  }
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

      const result = await createOrUpdatePanel();

      await interaction.reply({
        content: `Raid pack panel ${result.action}.`,
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

      if (interaction.customId === 'download_dungeon1') {
        const fileBuffer = await getFileBuffer('dungeon1.txt');

        await interaction.reply({
          content: 'Her er din Dungeon Pack 1/2 WeakAura-fil.',
          ephemeral: true,
          files: [
            {
              attachment: fileBuffer,
              name: 'dungeon1.txt',
            },
          ],
        });
        return;
      }

      if (interaction.customId === 'download_dungeon2') {
        const fileBuffer = await getFileBuffer('dungeon2.txt');

        await interaction.reply({
          content: 'Her er din Dungeon Pack 2/2 WeakAura-fil.',
          ephemeral: true,
          files: [
            {
              attachment: fileBuffer,
              name: 'dungeon2.txt',
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
