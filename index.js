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
      .setCustomId('download_hyjal')
      .setLabel('Hyjal v.1.1.1')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('download_bt_part1')
      .setLabel('BT - 1/2 - v.1.1.0')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('download_bt_part2')
      .setLabel('BT - 2/2 - v.1.1.0')
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('download_kara')
      .setLabel('Karazhan v1.0.8')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('download_tier4')
      .setLabel('Tier 4 Raiding Pack v1.0.4')
      .setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('download_tier5')
      .setLabel('Tier 5 Raiding Pack v2.0.0')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('download_tier5_frames')
      .setLabel('Tier 5 Raid Frames v2.0.0')
      .setStyle(ButtonStyle.Secondary)
  );

  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('download_dungeon1')
      .setLabel('Dungeon Pack 1/2')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('download_dungeon2')
      .setLabel('Dungeon Pack 2/2')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2, row3, row4];
}

function buildPanelContent() {
  return (
    '## Guide to Raid & Dungeon Packs\n\n' +
    '### __Raid Packs__\n' +
    'Follow these steps to install the Fojji Raid Packs.\n\n' +
    '1. Import [Fojji Raid Pack Anchors Classic](https://wago.io/FojjiRaidAnchors-Classic).\n' +
    '2. Download the latest version of [FojjiCore](https://www.curseforge.com/wow/addons/fojjicore).\n' +
    '3. Click one of the buttons below to receive the WeakAura file.\n' +
    '4. Download the complete file by clicking "•••" in the pop-up message and selecting "Download".\n' +
    '   - You cannot import the code directly from the pop-up message. You must download the file first.\n' +
    '5. Open the file in Notepad or another text editor, then copy and paste its contents into WeakAuras as an import.\n' +
    '6. The import may take a moment, and the game may temporarily freeze. This is normal. Wait until the import has finished.\n' +
    '7. Reload the game by typing `/reload`.\n' +
    '8. You are now ready.\n\n' +
    '### __Dungeon Packs__\n' +
    'Follow the same steps as above, but also import [FojjiAPI Role TBC](https://wago.io/FojjiAPIRoleTBC).\n\n' +
    '*Please ask if you need help.*'
  );
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('postraidpacks')
      .setDescription('Create or update the raid pack panel')
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(
    process.env.DISCORD_TOKEN
  );

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
  const panelChannel = await client.channels.fetch(
    process.env.PANEL_CHANNEL_ID
  );

  if (!panelChannel || !panelChannel.isTextBased()) {
    throw new Error(
      'PANEL_CHANNEL_ID is invalid or does not point to a text channel.'
    );
  }

  const payload = {
    content: buildPanelContent(),
    components: buildPanelRows(),
  };

  const panelMessageId = process.env.PANEL_MESSAGE_ID;

  if (!panelMessageId) {
    const newMessage = await panelChannel.send(payload);

    console.log(
      `Created panel message. PANEL_MESSAGE_ID=${newMessage.id}`
    );

    return {
      action: 'created',
      messageId: newMessage.id,
    };
  }

  try {
    const existingMessage = await panelChannel.messages.fetch(
      panelMessageId
    );

    await existingMessage.edit(payload);

    console.log(
      `Updated panel message. PANEL_MESSAGE_ID=${existingMessage.id}`
    );

    return {
      action: 'updated',
      messageId: existingMessage.id,
    };
  } catch (error) {
    const newMessage = await panelChannel.send(payload);

    console.log(
      `Old panel not found. Created a new panel message. PANEL_MESSAGE_ID=${newMessage.id}`
    );

    return {
      action: 'created',
      messageId: newMessage.id,
    };
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
      if (interaction.commandName !== 'postraidpacks') {
        return;
      }

      const result = await createOrUpdatePanel();

      await interaction.reply({
        content: `Raid pack panel ${result.action}.`,
        ephemeral: true,
      });

      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'download_hyjal') {
        const fileBuffer = await getFileBuffer('hyjal.txt');

        await interaction.reply({
          content: 'Here is your Hyjal WeakAura file.',
          ephemeral: true,
          files: [
            {
              attachment: fileBuffer,
              name: 'hyjal.txt',
            },
          ],
        });

        return;
      }

      if (interaction.customId === 'download_bt_part1') {
        const fileBuffer = await getFileBuffer('bt_part1.txt');

        await interaction.reply({
          content: 'Here is your BT WeakAura file 1/2.',
          ephemeral: true,
          files: [
            {
              attachment: fileBuffer,
              name: 'bt_part1.txt',
            },
          ],
        });

        return;
      }

      if (interaction.customId === 'download_bt_part2') {
        const fileBuffer = await getFileBuffer('bt_part2.txt');

        await interaction.reply({
          content: 'Here is your BT WeakAura file 2/2.',
          ephemeral: true,
          files: [
            {
              attachment: fileBuffer,
              name: 'bt_part2.txt',
            },
          ],
        });

        return;
      }

      if (interaction.customId === 'download_kara') {
        const fileBuffer = await getFileBuffer('kara.txt');

        await interaction.reply({
          content: 'Here is your Karazhan WeakAura file.',
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

      if (interaction.customId === 'download_tier5') {
        const fileBuffer = await getFileBuffer(
          'tier5-raid-pack.txt'
        );

        await interaction.reply({
          content: 'Here is your Tier 5 Raiding Pack WeakAura file.',
          ephemeral: true,
          files: [
            {
              attachment: fileBuffer,
              name: 'tier5-raid-pack.txt',
            },
          ],
        });

        return;
      }

      if (interaction.customId === 'download_tier5_frames') {
        const fileBuffer = await getFileBuffer(
          'tier5-raid-frames.txt'
        );

        await interaction.reply({
          content: 'Here is your Tier 5 Raid Frames WeakAura file.',
          ephemeral: true,
          files: [
            {
              attachment: fileBuffer,
              name: 'tier5-raid-frames.txt',
            },
          ],
        });

        return;
      }

      if (interaction.customId === 'download_dungeon1') {
        const fileBuffer = await getFileBuffer('dungeon1.txt');

        await interaction.reply({
          content: 'Here is your Dungeon Pack WeakAura file 1/2.',
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
          content: 'Here is your Dungeon Pack WeakAura file 2/2.',
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
        content: 'Unknown button.',
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(error);

    if (
      interaction.isRepliable() &&
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.reply({
        content: 'Something went wrong.',
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
