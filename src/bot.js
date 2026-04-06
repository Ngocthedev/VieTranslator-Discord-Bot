import { Client, GatewayIntentBits, Partials, Events, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import AdmZip from 'adm-zip';
import tar from 'tar';

// Internal modules
import { translateFile } from './translator.js';
import { registerCommands, handleSlashCommands } from './commands.js';
import { initKeyPool } from './ai-service.js';
import { loadGlossary } from './glossary.js';
import { initApiKeyManager } from './api-key-manager.js';
import { initUsageTracker, shutdownTracker, logRequest } from './usage-tracker.js';
import { checkDiscordLimit, consumeDiscordLimit } from './rate-limiter.js';
import { startApiServer } from './api-server.js';
import { loadConfig, getConfig } from './config.js';

// Load environment variables
dotenv.config();

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp & data directories
const tempDir = path.join(__dirname, '../temp');
const dataDir = path.join(__dirname, '../data');
fs.ensureDirSync(tempDir);
fs.ensureDirSync(dataDir);

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ============================================================
// Startup Sequence
// ============================================================

async function startup() {
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.yellow('🚀 VietHoa Bot v2.0 — Starting up...'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

  // Initialize core services
  await loadConfig();
  initKeyPool();
  await loadGlossary();
  await initApiKeyManager();
  await initUsageTracker();

  // Start Web API server
  try {
    await startApiServer();
  } catch (error) {
    console.error(chalk.red(`❌ Web API server failed to start: ${error.message}`));
    console.log(chalk.yellow('⚠️ Bot sẽ tiếp tục chạy mà không có Web API.'));
  }

  // Login to Discord
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error(chalk.red(`❌ Discord login failed: ${error.message}`));
    console.log(chalk.yellow('⚠️ Web API vẫn chạy bình thường. Hãy kiểm tra DISCORD_TOKEN và bật Message Content Intent.'));
  }
}

// ============================================================
// Discord Events
// ============================================================

client.once(Events.ClientReady, () => {
  console.log(chalk.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.green(`✅ Discord: Logged in as ${client.user.tag}`));
  console.log(chalk.yellow('🤖 VietHoa Bot v2.0 đã sẵn sàng!'));
  console.log(chalk.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  registerCommands(client);
});

// Handle prefix commands
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith('!viethoa')) {
    const config = getConfig();
    if (config.allowedChannelId && message.channel.id !== config.allowedChannelId) {
      // Cho phép Admin bỏ qua giới hạn kênh, không thì chặn
      if (!message.member || !message.member.permissions.has('Administrator')) {
        return message.reply({ content: `❌ Lệnh \`!viethoa\` chỉ được phép sử dụng tại kênh <#${config.allowedChannelId}>.`, ephemeral: true }).catch(console.error);
      }
    }
    await handleTranslationRequest(message);
  }
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  await handleSlashCommands(interaction);
});

// ============================================================
// Translation Request Handler (Discord)
// ============================================================

async function handleTranslationRequest(message) {
  try {
    // === Rate Limit Check ===
    const rateLimit = checkDiscordLimit(message.author.id);
    if (!rateLimit.allowed) {
      const embed = new EmbedBuilder().setColor(0xe74c3c).setTimestamp();

      if (rateLimit.reason === 'cooldown') {
        embed.setTitle('⏳ Vui lòng chờ')
          .setDescription(`Bạn cần chờ **${rateLimit.cooldownLeft} giây** trước khi dịch tiếp.`);
      } else {
        embed.setTitle('❌ Hết lượt dịch')
          .setDescription(`Bạn đã dùng hết **${rateLimit.limit}** lượt dịch hôm nay.\nReset lúc **00:00**.`)
          .addFields({ name: 'Lượt còn lại', value: `${rateLimit.remaining}/${rateLimit.limit}` });
      }

      await message.reply({ embeds: [embed] });
      return;
    }

    // === Check attachment ===
    if (message.attachments.size === 0) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❓ Thiếu tệp')
            .setDescription('Vui lòng đính kèm tệp cần dịch.\nVí dụ: `!viethoa` kèm theo tệp cấu hình.')
            .setColor(0xf39c12)
            .setTimestamp()
        ]
      });
      return;
    }

    const attachment = message.attachments.first();
    const fileExtension = path.extname(attachment.name).toLowerCase();

    // Check supported formats
    const supportedExtensions = [
      '.yml', '.yaml', '.json', '.txt', '.properties', '.lang',
      '.cfg', '.conf', '.config', '.ini', '.sk', '.zip', '.tar.gz'
    ];

    if (!supportedExtensions.includes(fileExtension)) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Định dạng không hỗ trợ')
            .setDescription(`Định dạng \`${fileExtension}\` không được hỗ trợ.\nHỗ trợ: ${supportedExtensions.join(', ')}`)
            .setColor(0xe74c3c)
            .setTimestamp()
        ]
      });
      return;
    }

    // Check file size (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (attachment.size > MAX_FILE_SIZE) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Tệp quá lớn')
            .setDescription(`Kích thước tối đa: 10MB. Tệp: ${(attachment.size / 1024 / 1024).toFixed(2)}MB`)
            .setColor(0xe74c3c)
            .setTimestamp()
        ]
      });
      return;
    }

    // === Consume rate limit ===
    consumeDiscordLimit(message.author.id);

    // === Status message ===
    const statusEmbed = new EmbedBuilder()
      .setTitle('🔄 Đang xử lý')
      .setDescription(`📄 ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)`)
      .setColor(0x3498db)
      .addFields({ name: 'Trạng thái', value: '⬇️ Đang tải tệp...' })
      .setTimestamp();

    const statusMessage = await message.reply({ embeds: [statusEmbed] });
    const startTime = Date.now();

    // === Download file ===
    const tempFilePath = path.join(tempDir, `${Date.now()}_${attachment.name}`);
    const response = await fetch(attachment.url);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(tempFilePath, Buffer.from(buffer));

    statusEmbed.setFields({ name: 'Trạng thái', value: '🔍 Đang phân tích tệp...' });
    await statusMessage.edit({ embeds: [statusEmbed] });

    let filesToTranslate = [];
    let isArchive = false;

    // Handle archives
    if (fileExtension === '.zip' || fileExtension === '.tar.gz') {
      isArchive = true;
      const extractDir = path.join(tempDir, `extract_${Date.now()}`);
      fs.ensureDirSync(extractDir);

      if (fileExtension === '.zip') {
        const zip = new AdmZip(tempFilePath);
        zip.extractAllTo(extractDir, true);
      } else {
        await tar.x({ file: tempFilePath, cwd: extractDir });
      }

      filesToTranslate = await collectSupportedFiles(extractDir);

      if (filesToTranslate.length === 0) {
        await statusMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Không tìm thấy tệp')
              .setDescription('Không tìm thấy tệp nào có thể dịch trong gói nén.')
              .setColor(0xe74c3c)
              .setTimestamp()
          ]
        });
        await fs.remove(tempFilePath);
        return;
      }

      statusEmbed.setDescription(`📦 Tìm thấy ${filesToTranslate.length} tệp trong gói nén.`);
      await statusMessage.edit({ embeds: [statusEmbed] });
    } else {
      filesToTranslate = [{ path: tempFilePath, name: attachment.name }];
    }

    // === Translate files ===
    let completedFiles = 0;
    const totalFiles = filesToTranslate.length;

    const updateProgress = async (current, total, fileName) => {
      const pct = Math.floor((current / total) * 100);
      const filled = Math.floor(20 * (current / total));
      const bar = '▰'.repeat(filled) + '▱'.repeat(20 - filled);

      statusEmbed.setFields(
        { name: '📄 Tệp', value: fileName },
        { name: '📊 Tổng', value: `${completedFiles}/${totalFiles} tệp` },
        { name: '🔄 Tiến độ', value: `${bar} ${pct}%` }
      );

      try {
        await statusMessage.edit({ embeds: [statusEmbed] });
      } catch (e) { /* ignore rate limit */ }
    };

    const translatedFiles = [];
    for (const file of filesToTranslate) {
      console.log(chalk.cyan(`📄 Translating ${file.name} for ${message.author.tag}`));

      const { content: translatedContent, warnings } = await translateFile(
        file.path,
        path.extname(file.name).toLowerCase(),
        message.author.id,
        (current, total) => updateProgress(current, total, file.name)
      );

      // Keep original file name:
      const translatedFilePath = path.join(tempDir, file.name);
      await fs.writeFile(translatedFilePath, translatedContent);
      translatedFiles.push({ path: translatedFilePath, name: file.name, warnings });
      completedFiles++;
    }

    // === Create output ===
    let finalAttachment;
    if (translatedFiles.length > 1) {
      const zipPath = path.join(tempDir, `${path.parse(attachment.name).name}_vi.zip`);
      const zip = new AdmZip();
      for (const file of translatedFiles) {
        zip.addLocalFile(file.path, '', file.name);
      }
      zip.writeZip(zipPath);
      finalAttachment = new AttachmentBuilder(zipPath, { name: path.basename(zipPath) });
    } else {
      finalAttachment = new AttachmentBuilder(translatedFiles[0].path, { name: translatedFiles[0].name });
    }

    const translationTime = Date.now() - startTime;

    // === Send result ===
    try {
      const allWarnings = translatedFiles.flatMap(f => f.warnings || []);
      let warningDesc = '';
      if (allWarnings.length > 0) {
        warningDesc = `\n\n⚠️ **Chú ý:** Có ${allWarnings.length} chunk bị huỷ dịch (giữ nguyên tiếng Anh) do AI làm gãy cấu trúc dòng:\n` + 
          allWarnings.slice(0, 3).map(w => `• ${w}`).join('\n') + 
          (allWarnings.length > 3 ? `\n*...và ${allWarnings.length - 3} đoạn khác.*` : '');
      }

      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Dịch hoàn tất')
            .setDescription((isArchive
              ? `Đã dịch ${translatedFiles.length} tệp trong gói nén.`
              : 'Đây là kết quả tệp của bạn:') + warningDesc)
            .addFields({ name: '⏱️ Thời gian', value: `${(translationTime / 1000).toFixed(1)}s` })
            .setColor(0x2ecc71)
            .setTimestamp()
        ],
        files: [finalAttachment]
      });

      statusEmbed.setTitle('✅ Dịch hoàn tất');
      statusEmbed.setDescription('Bản dịch đã được gửi qua DM.');
      statusEmbed.setColor(0x2ecc71);
      statusEmbed.setFields(
        { name: '📄 Tệp', value: attachment.name, inline: true },
        { name: '📊 Số tệp', value: `${translatedFiles.length}`, inline: true },
        { name: '⏱️ Thời gian', value: `${(translationTime / 1000).toFixed(1)}s`, inline: true },
      );
      await statusMessage.edit({ embeds: [statusEmbed] });
    } catch (error) {
      console.error(chalk.red('Error sending DM:', error.message));
      statusEmbed.setTitle('⚠️ Không thể gửi DM');
      statusEmbed.setDescription('Gửi bản dịch trong kênh này...');
      statusEmbed.setColor(0xf39c12);
      await statusMessage.edit({ embeds: [statusEmbed] });

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Dịch hoàn tất')
            .setDescription('Đây là bản dịch của bạn:' + warningDesc)
            .setColor(0x2ecc71)
            .setTimestamp()
        ],
        files: [finalAttachment]
      });
    }

    // === Log request ===
    await logRequest({
      source: 'discord',
      userId: message.author.id,
      format: fileExtension.replace('.', ''),
      contentSize: attachment.size,
      status: 'success',
      translationTime,
    });

    // === Cleanup ===
    await fs.remove(tempFilePath);
    for (const file of translatedFiles) {
      await fs.remove(file.path).catch(() => {});
    }

  } catch (error) {
    console.error(chalk.red('Translation error:', error));
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Lỗi dịch')
          .setDescription(`${error.message}\nVui lòng thử lại sau.`)
          .setColor(0xe74c3c)
          .setTimestamp()
      ]
    });

    await logRequest({
      source: 'discord',
      userId: message.author.id,
      status: 'error',
      error: error.message,
    });
  }
}

/**
 * Recursively collect supported files
 */
async function collectSupportedFiles(dir) {
  const supported = ['.yml', '.yaml', '.json', '.txt', '.properties', '.lang', '.cfg', '.conf', '.config', '.ini', '.sk'];
  const files = [];
  const items = await fs.readdir(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      files.push(...await collectSupportedFiles(fullPath));
    } else if (supported.includes(path.extname(item).toLowerCase())) {
      files.push({ path: fullPath, name: item });
    }
  }
  return files;
}

// ============================================================
// Graceful Shutdown
// ============================================================

process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n🛑 Shutting down...'));
  await shutdownTracker();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdownTracker();
  client.destroy();
  process.exit(0);
});

// ============================================================
// Start
// ============================================================

startup().catch(error => {
  console.error(chalk.red('❌ Fatal startup error:', error));
  process.exit(1);
});