import { Client, GatewayIntentBits, Partials, Events, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { translateFile } from './translator.js';
import { registerCommands, handleSlashCommands } from './commands.js';
import chalk from 'chalk';
import AdmZip from 'adm-zip';
import tar from 'tar';

// Load environment variables
dotenv.config();

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

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

// Bot ready event
client.once(Events.ClientReady, () => {
  console.log(chalk.green(`Logged in as ${client.user.tag}`));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.yellow('VietHoa Bot đã sẵn sàng để dịch!'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  registerCommands(client);
});

// Message event handler
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Handle prefix commands
  if (message.content.startsWith('!viethoa')) {
    await handleTranslationRequest(message);
  }
});

// Interaction event handler
client.on(Events.InteractionCreate, async (interaction) => {
  await handleSlashCommands(interaction);
});

// Handle translation request
async function handleTranslationRequest(message) {
  try {
    // Check if there's an attachment
    if (message.attachments.size === 0) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❓ Thiếu tệp')
            .setDescription('Vui lòng đính kèm tệp cần dịch. Ví dụ: `!viethoa` kèm theo tệp cấu hình.')
            .setColor(0xf39c12)
            .setTimestamp()
        ]
      });
      return;
    }

    const attachment = message.attachments.first();
    const fileExtension = path.extname(attachment.name).toLowerCase();
    
    // Check supported file types
    const supportedExtensions = [
      '.yml', '.yaml', '.json', '.txt', '.properties', '.lang', 
      '.cfg', '.conf', '.config', '.ini', '.sk', '.zip', '.tar.gz'
    ];
    
    if (!supportedExtensions.includes(fileExtension)) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Định dạng không hỗ trợ')
            .setDescription(`Định dạng tệp không được hỗ trợ. Các định dạng được hỗ trợ: ${supportedExtensions.join(', ')}`)
            .setColor(0xe74c3c)
            .setTimestamp()
        ]
      });
      return;
    }

    // Check file size (limit to 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (attachment.size > MAX_FILE_SIZE) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Tệp quá lớn')
            .setDescription(`Tệp quá lớn. Kích thước tối đa là 10MB. Tệp của bạn: ${(attachment.size / 1024 / 1024).toFixed(2)}MB`)
            .setColor(0xe74c3c)
            .setTimestamp()
        ]
      });
      return;
    }

    // Notify user that translation is in progress
    const statusEmbed = new EmbedBuilder()
      .setTitle('🔄 Đang xử lý')
      .setDescription(`Đang xử lý tệp: ${attachment.name} (${(attachment.size / 1024).toFixed(2)} KB)`)
      .setColor(0x3498db)
      .addFields({ name: 'Trạng thái', value: 'Đang tải tệp...' })
      .setTimestamp();
    
    const statusMessage = await message.reply({ embeds: [statusEmbed] });

    // Download the file
    const tempFilePath = path.join(tempDir, attachment.name);
    const response = await fetch(attachment.url);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(tempFilePath, Buffer.from(buffer));

    // Update status message
    statusEmbed.setFields({ name: 'Trạng thái', value: 'Đang chuẩn bị dịch...' });
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
        await tar.x({
          file: tempFilePath,
          cwd: extractDir
        });
      }

      // Collect all supported files from the archive
      filesToTranslate = await collectSupportedFiles(extractDir);

      if (filesToTranslate.length === 0) {
        await statusMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Không tìm thấy tệp hỗ trợ')
              .setDescription('Không tìm thấy tệp nào có thể dịch trong gói nén.')
              .setColor(0xe74c3c)
              .setTimestamp()
          ]
        });
        return;
      }

      statusEmbed.setDescription(`Đã tìm thấy ${filesToTranslate.length} tệp có thể dịch trong gói nén.`);
      await statusMessage.edit({ embeds: [statusEmbed] });
    } else {
      filesToTranslate = [{ path: tempFilePath, name: attachment.name }];
    }

    // Initialize progress tracking
    let progressBar = '';
    let progressPercentage = 0;
    let lastUpdateTime = Date.now();
    let totalFiles = filesToTranslate.length;
    let completedFiles = 0;
    
    // Progress callback function
    const updateProgress = async (current, total, fileName) => {
      const newPercentage = Math.floor((current / total) * 100);
      const currentTime = Date.now();
      
      // Only update if percentage has changed significantly or enough time has passed
      if (newPercentage > progressPercentage + 4 || currentTime - lastUpdateTime > 5000) {
        progressPercentage = newPercentage;
        lastUpdateTime = currentTime;
        
        // Create progress bar
        const filledLength = Math.floor(20 * (current / total));
        const emptyLength = 20 - filledLength;
        
        progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
        
        // Update status message
        statusEmbed.setFields(
          { name: 'Tệp hiện tại', value: fileName },
          { name: 'Tiến độ tổng thể', value: `${completedFiles}/${totalFiles} tệp (${Math.floor((completedFiles/totalFiles) * 100)}%)` },
          { name: 'Tiến độ tệp hiện tại', value: `${progressBar} ${progressPercentage}% (${current}/${total} phần)` }
        );
        
        try {
          await statusMessage.edit({ embeds: [statusEmbed] });
        } catch (error) {
          console.error(chalk.red('Error updating status message:', error.message));
        }
      }
    };

    // Process each file
    const translatedFiles = [];
    for (const file of filesToTranslate) {
      console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.yellow(`Starting translation of ${file.name} for user ${message.author.tag} (${message.author.id})`));
      
      const translatedContent = await translateFile(
        file.path, 
        path.extname(file.name).toLowerCase(), 
        message.author.id, 
        (current, total) => updateProgress(current, total, file.name)
      );
      
      console.log(chalk.green(`Translation completed for ${file.name}`));
      
      // Create a new file with the translated content
      const translatedFilePath = path.join(tempDir, `vietnamese_${file.name}`);
      await fs.writeFile(translatedFilePath, translatedContent);
      
      translatedFiles.push({
        path: translatedFilePath,
        name: `vietnamese_${file.name}`
      });
      
      completedFiles++;
    }

    // Create a zip file if multiple files were translated
    let finalAttachment;
    if (translatedFiles.length > 1) {
      const zipPath = path.join(tempDir, `vietnamese_${path.parse(attachment.name).name}.zip`);
      const zip = new AdmZip();
      
      for (const file of translatedFiles) {
        zip.addLocalFile(file.path, '', file.name);
      }
      
      zip.writeZip(zipPath);
      finalAttachment = new AttachmentBuilder(zipPath, { name: path.basename(zipPath) });
    } else {
      finalAttachment = new AttachmentBuilder(translatedFiles[0].path, { name: translatedFiles[0].name });
    }

    // Send the translated file(s) to the user's DM
    try {
      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Dịch hoàn tất')
            .setDescription(isArchive ? 
              `Đã dịch ${translatedFiles.length} tệp trong gói nén của bạn:` :
              'Đây là bản dịch tiếng Việt của tệp của bạn:')
            .setColor(0x2ecc71)
            .setTimestamp()
        ],
        files: [finalAttachment]
      });
      
      // Notify in the channel that the translation was sent via DM
      statusEmbed.setTitle('✅ Dịch hoàn tất');
      statusEmbed.setDescription('Bản dịch đã được gửi qua tin nhắn riêng (DM).');
      statusEmbed.setColor(0x2ecc71);
      statusEmbed.setFields(
        { name: 'Tệp gốc', value: attachment.name },
        { name: 'Số tệp đã dịch', value: `${translatedFiles.length}` }
      );
      await statusMessage.edit({ embeds: [statusEmbed] });
    } catch (error) {
      console.error(chalk.red('Error sending DM:', error.message));
      // If DM fails, send in the channel
      statusEmbed.setTitle('⚠️ Không thể gửi DM');
      statusEmbed.setDescription('Không thể gửi tin nhắn riêng. Đang gửi bản dịch trong kênh này...');
      statusEmbed.setColor(0xf39c12);
      await statusMessage.edit({ embeds: [statusEmbed] });
      
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Dịch hoàn tất')
            .setDescription(isArchive ?
              `Đã dịch ${translatedFiles.length} tệp trong gói nén của bạn:` :
              'Đây là bản dịch của bạn:')
            .setColor(0x2ecc71)
            .setTimestamp()
        ],
        files: [finalAttachment]
      });
    }

    // Clean up temporary files
    await fs.remove(tempFilePath);
    for (const file of translatedFiles) {
      await fs.remove(file.path);
    }
    if (isArchive) {
      await fs.remove(path.join(tempDir, `extract_${Date.now()}`));
    }
    
  } catch (error) {
    console.error(chalk.red('Translation error:', error));
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Lỗi dịch')
          .setDescription(`Đã xảy ra lỗi trong quá trình dịch: ${error.message}. Vui lòng thử lại sau.`)
          .setColor(0xe74c3c)
          .setTimestamp()
      ]
    });
  }
}

/**
 * Recursively collect all supported files from a directory
 * @param {string} dir - Directory to scan
 * @returns {Promise<Array>} - Array of file objects with path and name
 */
async function collectSupportedFiles(dir) {
  const supportedExtensions = ['.yml', '.yaml', '.json', '.txt', '.properties', '.lang', '.cfg', '.conf', '.config', '.ini', '.sk'];
  const files = [];

  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      const subFiles = await collectSupportedFiles(fullPath);
      files.push(...subFiles);
    } else if (supportedExtensions.includes(path.extname(item).toLowerCase())) {
      files.push({
        path: fullPath,
        name: item
      });
    }
  }

  return files;
}

// Login to Discord
client.login(process.env.DISCORD_TOKEN);