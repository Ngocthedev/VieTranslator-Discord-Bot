import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { translateShortText } from './ai-service.js';

dotenv.config();

/**
 * Registers slash commands with Discord
 * @param {Client} client - Discord client
 */
export async function registerCommands(client) {
  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Kiểm tra độ trễ của bot'),
    
    new SlashCommandBuilder()
      .setName('model')
      .setDescription('Hiển thị mô hình AI hiện tại'),
    
    new SlashCommandBuilder()
      .setName('settings')
      .setDescription('Cài đặt tùy chọn dịch')
      .addBooleanOption(option =>
        option.setName('translate_comments')
          .setDescription('Dịch các chú thích trong mã')
          .setRequired(false))
      .addBooleanOption(option =>
        option.setName('verbose')
          .setDescription('Hiển thị thông tin chi tiết trong quá trình dịch')
          .setRequired(false)),
    
    new SlashCommandBuilder()
      .setName('help')
      .setDescription('Hiển thị hướng dẫn sử dụng bot'),
    
    new SlashCommandBuilder()
      .setName('test')
      .setDescription('Kiểm tra dịch văn bản')
      .addStringOption(option => 
        option.setName('text')
          .setDescription('Văn bản cần dịch')
          .setRequired(true)),

    new SlashCommandBuilder()
      .setName('reload')
      .setDescription('Tải lại các lệnh của bot'),
  ];

  try {
    console.log('Started refreshing application (/) commands.');

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

/**
 * Get model display name
 * @param {string} modelId - Model identifier
 * @returns {string} - Display name
 */
function getModelDisplayName(modelId) {
  return 'Gemini 2 Flash';
}

/**
 * Get model description
 * @param {string} modelId - Model identifier
 * @returns {string} - Model description
 */
function getModelDescription(modelId) {
  return '⚡ Phiên bản Flash của Gemini 2, siêu nhanh và chính xác';
}

/**
 * Handle slash command interactions
 * @param {Interaction} interaction - Discord interaction
 */
export async function handleSlashCommands(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'ping':
        await handlePingCommand(interaction);
        break;
      case 'model':
        await handleModelCommand(interaction);
        break;
      case 'settings':
        await handleSettingsCommand(interaction);
        break;
      case 'help':
        await handleHelpCommand(interaction);
        break;
      case 'test':
        await handleTestCommand(interaction);
        break;
      case 'reload':
        await handleReloadCommand(interaction);
        break;
    }
  } catch (error) {
    console.error(`Error handling command ${commandName}:`, error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: `❌ Đã xảy ra lỗi: ${error.message}`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `❌ Đã xảy ra lỗi: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

/**
 * Handle ping command
 * @param {Interaction} interaction - Discord interaction
 */
async function handlePingCommand(interaction) {
  const sent = await interaction.reply({ 
    content: '🔄 Đang tính toán độ trễ...', 
    fetchReply: true 
  });
  
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  
  await interaction.editReply({
    embeds: [{
      title: '🏓 Pong!',
      description: `**Độ trễ:** ${latency}ms\n**Độ trễ API:** ${Math.round(interaction.client.ws.ping)}ms`,
      color: 0x3498db,
      timestamp: new Date().toISOString()
    }]
  });
}

/**
 * Handle model command
 * @param {Interaction} interaction - Discord interaction
 */
async function handleModelCommand(interaction) {
  await interaction.reply({
    embeds: [{
      title: '🤖 Mô hình AI',
      description: `Bot đang sử dụng mô hình: **${getModelDisplayName()}**\n\n${getModelDescription()}`,
      color: 0x9b59b6,
      timestamp: new Date().toISOString()
    }]
  });
}

/**
 * Handle settings command
 * @param {Interaction} interaction - Discord interaction
 */
async function handleSettingsCommand(interaction) {
  const translateComments = interaction.options.getBoolean('translate_comments');
  const verbose = interaction.options.getBoolean('verbose');
  
  // Update user settings (implement storage mechanism)
  const settings = {
    translateComments: translateComments ?? true,
    verbose: verbose ?? false
  };
  
  await interaction.reply({
    embeds: [{
      title: '⚙️ Cài đặt dịch thuật',
      description: 'Đã cập nhật cài đặt của bạn:',
      fields: [
        {
          name: 'Dịch chú thích',
          value: settings.translateComments ? '✅ Bật' : '❌ Tắt',
          inline: true
        },
        {
          name: 'Thông tin chi tiết',
          value: settings.verbose ? '✅ Bật' : '❌ Tắt',
          inline: true
        }
      ],
      color: 0xf1c40f,
      timestamp: new Date().toISOString()
    }]
  });
}

/**
 * Handle help command
 * @param {Interaction} interaction - Discord interaction
 */
async function handleHelpCommand(interaction) {
  await interaction.reply({
    embeds: [{
      author: {
        name: 'Tác giả: Demure',
        icon_url: interaction.client.user.displayAvatarURL()
      },
      title: '📚 Hướng dẫn sử dụng VietHoa Bot',
      description: 'Bot giúp dịch các tệp cấu hình và ngôn ngữ của Minecraft sang tiếng Việt.',
      fields: [
        {
          name: '🔤 Lệnh cơ bản',
          value: '`!viethoa` + đính kèm tệp cần dịch\nBot sẽ dịch tệp và gửi lại qua DM.'
        },
        {
          name: '⚡ Lệnh nhanh',
          value: [
            '`/ping` - Kiểm tra độ trễ',
            '`/model` - Xem mô hình AI',
            '`/settings` - Tùy chỉnh cài đặt',
            '`/test` - Kiểm tra dịch văn bản',
            '`/reload` - Tải lại các lệnh của bot'
          ].join('\n')
        },
        {
          name: '📁 Định dạng hỗ trợ',
          value: '`.yml`, `.yaml`, `.json`, `.properties`, `.lang`, `.txt`, `.cfg`, `.conf`, `.ini`, `.sk`'
        },
        {
          name: '📦 Tính năng',
          value: [
            '• Dịch thông minh với AI tiên tiến',
            '• Giữ nguyên cấu trúc và mã',
            '• Hỗ trợ nhiều định dạng tệp',
            '• Xử lý song song để tăng tốc',
            '• Tự động sửa lỗi và kiểm tra'
          ].join('\n')
        }
      ],
      color: 0x3498db,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Sử dụng /help để xem lại hướng dẫn này'
      }
    }]
  });
}


/**
 * Handle test command
 * @param {Interaction} interaction - Discord interaction
 */
async function handleTestCommand(interaction) {
  const text = interaction.options.getString('text');
  
  await interaction.deferReply();
  
  try {
    const translatedText = await translateShortText(text, interaction.user.id);
    
    await interaction.editReply({
      embeds: [{
        title: '🔄 Kiểm tra dịch văn bản',
        fields: [
          {
            name: '📝 Văn bản gốc',
            value: text
          },
          {
            name: '🌐 Văn bản đã dịch',
            value: translatedText
          }
        ],
        color: 0x2ecc71,
        timestamp: new Date().toISOString()
      }]
    });
  } catch (error) {
    await interaction.editReply({
      embeds: [{
        title: '❌ Lỗi dịch văn bản',
        description: `Đã xảy ra lỗi khi dịch văn bản: ${error.message}`,
        color: 0xe74c3c,
        timestamp: new Date().toISOString()
      }]
    });
  }
}

/**
 * Handle reload command
 * @param {Interaction} interaction - Discord interaction
 */
// async function handleReloadCommand(interaction) {
//   // Check if user is bot owner
//   if (interaction.user.id !== process.env.BOT_OWNER_ID) {
//     await interaction.reply({
//       embeds: [{
//         title: '❌ Không có quyền',
//         description: 'Chỉ chủ sở hữu bot mới có thể sử dụng lệnh này.',
//         color: 0xe74c3c,
//         timestamp: new Date().toISOString()
//       }],
//       ephemeral: true
//     });
//     return;
//   }

//   await interaction.deferReply();

//   try {
//     await registerCommands(interaction.client);
    
//     await interaction.editReply({
//       embeds: [{
//         title: '✅ Tải lại thành công',
//         description: 'Đã tải lại tất cả các lệnh của bot.',
//         color: 0x2ecc71,
//         timestamp: new Date().toISOString()
//       }]
//     });
//   } catch (error) {
//     await interaction.editReply({
//       embeds: [{
//         title: '❌ Lỗi tải lại',
//         description: `Đã xảy ra lỗi khi tải lại các lệnh: ${error.message}`,
//         color: 0xe74c3c,
//         timestamp: new Date().toISOString()
//       }]
//     });
//   }
// }