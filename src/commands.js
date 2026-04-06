import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import { translateShortText, getQuotaStatus } from './ai-service.js';
import { createApiKey, deleteApiKey, listApiKeys, toggleApiKey, findApiKey } from './api-key-manager.js';
import { getApiKeyStatsToday } from './usage-tracker.js';
import { getDiscordUsageStats } from './rate-limiter.js';
import { getCacheStats } from './translation-cache.js';
import { getGlossary, addTerm, removeTerm } from './glossary.js';
import { setAllowedChannel, getConfig } from './config.js';

dotenv.config();

/**
 * Register slash commands with Discord
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
      .setName('ratelimit')
      .setDescription('Xem lượt dịch còn lại của bạn'),

    // === API Key Management (Admin only) ===
    new SlashCommandBuilder()
      .setName('apikey')
      .setDescription('Quản lý API keys (Admin)')
      .addSubcommand(sub =>
        sub.setName('create')
          .setDescription('Tạo API key mới')
          .addStringOption(opt =>
            opt.setName('name')
              .setDescription('Tên cho API key (VD: Website Minecraft VN)')
              .setRequired(true))
          .addIntegerOption(opt =>
            opt.setName('user_limit')
              .setDescription('Giới hạn mỗi user/ngày (mặc định: 10)')
              .setRequired(false))
          .addIntegerOption(opt =>
            opt.setName('expires_days')
              .setDescription('Hết hạn sau bao nhiêu ngày (mặc định: không giới hạn)')
              .setRequired(false)))
      .addSubcommand(sub =>
        sub.setName('delete')
          .setDescription('Xoá API key')
          .addStringOption(opt =>
            opt.setName('key')
              .setDescription('API key hoặc tên key')
              .setRequired(true)))
      .addSubcommand(sub =>
        sub.setName('list')
          .setDescription('Liệt kê tất cả API keys'))
      .addSubcommand(sub =>
        sub.setName('info')
          .setDescription('Xem chi tiết API key')
          .addStringOption(opt =>
            opt.setName('key')
              .setDescription('API key hoặc tên key')
              .setRequired(true)))
      .addSubcommand(sub =>
        sub.setName('toggle')
          .setDescription('Bật/tắt API key')
          .addStringOption(opt =>
            opt.setName('key')
              .setDescription('API key hoặc tên key')
              .setRequired(true)))
      .addSubcommand(sub =>
        sub.setName('stats')
          .setDescription('Thống kê usage của API key')
          .addStringOption(opt =>
            opt.setName('key')
              .setDescription('API key hoặc tên key')
              .setRequired(true))),

    // === Quota Monitoring (Admin) ===
    new SlashCommandBuilder()
      .setName('quota')
      .setDescription('Xem OpenRouter API quota hiện tại (Admin)'),

    new SlashCommandBuilder()
      .setName('setchannel')
      .setDescription('Đặt kênh được phép dùng lệnh !viethoa (Admin)')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addChannelOption(opt =>
        opt.setName('channel')
          .setDescription('Chỉ định kênh (để trống để xoá cài đặt)')
          .setRequired(false)),

    // === Glossary Management ===
    new SlashCommandBuilder()
      .setName('glossary')
      .setDescription('Quản lý bảng thuật ngữ Minecraft')
      .addSubcommand(sub =>
        sub.setName('list')
          .setDescription('Xem bảng thuật ngữ')
          .addIntegerOption(opt =>
            opt.setName('page')
              .setDescription('Trang (mỗi trang 20 thuật ngữ)')
              .setRequired(false)))
      .addSubcommand(sub =>
        sub.setName('add')
          .setDescription('Thêm thuật ngữ mới (Admin)')
          .addStringOption(opt =>
            opt.setName('en')
              .setDescription('Thuật ngữ tiếng Anh')
              .setRequired(true))
          .addStringOption(opt =>
            opt.setName('vi')
              .setDescription('Bản dịch tiếng Việt')
              .setRequired(true)))
      .addSubcommand(sub =>
        sub.setName('remove')
          .setDescription('Xoá thuật ngữ (Admin)')
          .addStringOption(opt =>
            opt.setName('en')
              .setDescription('Thuật ngữ tiếng Anh cần xoá')
              .setRequired(true))),
  ];

  try {
    console.log('🔄 Registering slash commands...');
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log('✅ Slash commands registered successfully');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

/**
 * Check if user is bot owner
 */
function isOwner(userId) {
  return userId === process.env.BOT_OWNER_ID;
}

/**
 * Handle slash commands
 */
export async function handleSlashCommands(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'ping': return await handlePing(interaction);
      case 'model': return await handleModel(interaction);
      case 'help': return await handleHelp(interaction);
      case 'test': return await handleTest(interaction);
      case 'ratelimit': return await handleRateLimit(interaction);
      case 'apikey': return await handleApiKey(interaction);
      case 'quota': return await handleQuota(interaction);
      case 'glossary': return await handleGlossary(interaction);
      case 'setchannel': return await handleSetChannel(interaction);
    }
  } catch (error) {
    console.error(`❌ Command error (${commandName}):`, error);
    const reply = {
      embeds: [{
        title: '❌ Lỗi',
        description: `Đã xảy ra lỗi: ${error.message}`,
        color: 0xe74c3c,
        timestamp: new Date().toISOString()
      }],
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}

// ============================================================
// Command Handlers
// ============================================================

async function handlePing(interaction) {
  const sent = await interaction.reply({ content: '🔄 Measuring...', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;

  await interaction.editReply({
    content: null,
    embeds: [{
      title: '🏓 Pong!',
      fields: [
        { name: '📡 Độ trễ', value: `${latency}ms`, inline: true },
        { name: '🌐 API', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true },
      ],
      color: 0x3498db,
      timestamp: new Date().toISOString()
    }]
  });
}

async function handleModel(interaction) {
  const cacheStats = getCacheStats();
  await interaction.reply({
    embeds: [{
      title: '🤖 Mô hình AI',
      description: `**OpenRouter Flash Lite** ⚡`,
      fields: [
        { name: '📊 Cache', value: `${cacheStats.entries} entries | Hit rate: ${cacheStats.hitRate}%`, inline: false },
        { name: '🔧 Tính năng', value: '• Auto-detect language\n• Minecraft glossary\n• Selective translation\n• Smart key rotation', inline: false },
      ],
      color: 0x9b59b6,
      timestamp: new Date().toISOString()
    }]
  });
}

async function handleHelp(interaction) {
  await interaction.reply({
    embeds: [{
      author: { name: 'VietHoa Bot v2.0', icon_url: interaction.client.user.displayAvatarURL() },
      title: '📚 Hướng dẫn sử dụng',
      description: 'Bot dịch file cấu hình Minecraft sang tiếng Việt bằng AI.',
      fields: [
        {
          name: '🔤 Dịch File',
          value: '`!viethoa` + đính kèm file\nBot dịch và gửi qua DM.'
        },
        {
          name: '⚡ Lệnh',
          value: [
            '`/test <text>` — Thử dịch nhanh',
            '`/ratelimit` — Xem lượt dịch còn lại',
            '`/ping` — Kiểm tra độ trễ',
            '`/model` — Xem mô hình AI',
            '`/glossary list` — Xem thuật ngữ MC',
          ].join('\n')
        },
        {
          name: '👑 Admin',
          value: [
            '`/apikey create/delete/list/toggle/stats`',
            '`/quota` — Xem OpenRouter quota',
            '`/glossary add/remove`',
            '`/setchannel` — Cài đặt kênh dùng bot',
          ].join('\n')
        },
        {
          name: '📁 File hỗ trợ',
          value: '`.yml` `.yaml` `.json` `.properties` `.lang` `.txt` `.cfg` `.conf` `.ini` `.sk` `.zip` `.tar.gz`'
        },
        {
          name: '🌐 Web API',
          value: 'Hỗ trợ dịch qua API endpoint. Admin tạo key bằng `/apikey create`.'
        }
      ],
      color: 0x3498db,
      timestamp: new Date().toISOString(),
      footer: { text: 'VietHoa Bot v2.0 — Powered by OpenRouter AI' }
    }]
  });
}

async function handleTest(interaction) {
  const text = interaction.options.getString('text');
  await interaction.deferReply();

  try {
    const translated = await translateShortText(text, interaction.user.id);

    await interaction.editReply({
      embeds: [{
        title: '🔄 Kết quả dịch',
        fields: [
          { name: '📝 Gốc', value: text.substring(0, 1024) },
          { name: '🇻🇳 Dịch', value: translated.substring(0, 1024) },
        ],
        color: 0x2ecc71,
        timestamp: new Date().toISOString()
      }]
    });
  } catch (error) {
    await interaction.editReply({
      embeds: [{
        title: '❌ Lỗi dịch',
        description: error.message,
        color: 0xe74c3c,
        timestamp: new Date().toISOString()
      }]
    });
  }
}

async function handleRateLimit(interaction) {
  const usage = getDiscordUsageStats(interaction.user.id);

  const bar = '▰'.repeat(usage.used) + '▱'.repeat(Math.max(0, usage.limit - usage.used));

  await interaction.reply({
    embeds: [{
      title: '📊 Lượt dịch của bạn',
      fields: [
        { name: 'Hôm nay', value: `${bar}\n**${usage.used}/${usage.limit}** lượt đã dùng`, inline: false },
        { name: 'Còn lại', value: `**${usage.remaining}** lượt`, inline: true },
        { name: 'Reset', value: 'Lúc 00:00 hàng ngày', inline: true },
      ],
      color: usage.remaining > 0 ? 0x2ecc71 : 0xe74c3c,
      timestamp: new Date().toISOString()
    }],
    ephemeral: true
  });
}

// ============================================================
// API Key Commands (Admin Only)
// ============================================================

async function handleApiKey(interaction) {
  if (!isOwner(interaction.user.id)) {
    return interaction.reply({
      embeds: [{
        title: '❌ Không có quyền',
        description: 'Chỉ chủ bot mới có thể quản lý API keys.',
        color: 0xe74c3c
      }],
      ephemeral: true
    });
  }

  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case 'create': {
      const name = interaction.options.getString('name');
      const userLimit = interaction.options.getInteger('user_limit') || 10;
      const expiresDays = interaction.options.getInteger('expires_days') || null;

      await interaction.deferReply({ ephemeral: true });

      const key = await createApiKey(name, interaction.user.id, {
        dailyLimitPerUser: userLimit,
        expiresDays,
      });

      await interaction.editReply({
        embeds: [{
          title: '✅ API Key đã tạo',
          description: `**Tên:** ${name}\n**Key:** \`${key.key}\``,
          fields: [
            { name: 'Giới hạn/user/ngày', value: `${userLimit}`, inline: true },
            { name: 'Hết hạn', value: expiresDays ? `${expiresDays} ngày` : 'Không giới hạn', inline: true },
          ],
          color: 0x2ecc71,
          footer: { text: '⚠️ Lưu key này và gửi cho chủ website. Key chỉ hiển thị 1 lần!' },
          timestamp: new Date().toISOString()
        }]
      });
      break;
    }

    case 'delete': {
      const query = interaction.options.getString('key');
      const found = findApiKey(query);

      if (!found) {
        return interaction.reply({
          embeds: [{ title: '❌ Không tìm thấy', description: 'Không tìm thấy API key.', color: 0xe74c3c }],
          ephemeral: true
        });
      }

      await deleteApiKey(found.key);
      await interaction.reply({
        embeds: [{
          title: '🗑️ Đã xoá API Key',
          description: `**${found.name}** đã bị xoá.`,
          color: 0xf39c12
        }],
        ephemeral: true
      });
      break;
    }

    case 'list': {
      const keys = listApiKeys();
      if (keys.length === 0) {
        return interaction.reply({
          embeds: [{
            title: '🔑 API Keys',
            description: 'Chưa có API key nào. Dùng `/apikey create` để tạo.',
            color: 0x95a5a6
          }],
          ephemeral: true
        });
      }

      const list = keys.map((k, i) =>
        `**${i + 1}.** ${k.isActive ? '✅' : '❌'} **${k.name}**\n   Key: \`${k.key}\` | Limit: ${k.dailyLimitPerUser}/user/ngày | Total: ${k.totalRequests} reqs`
      ).join('\n\n');

      await interaction.reply({
        embeds: [{
          title: `🔑 API Keys (${keys.length})`,
          description: list.substring(0, 4000),
          color: 0x3498db,
          timestamp: new Date().toISOString()
        }],
        ephemeral: true
      });
      break;
    }

    case 'info': {
      const query = interaction.options.getString('key');
      const found = findApiKey(query);

      if (!found) {
        return interaction.reply({
          embeds: [{ title: '❌ Không tìm thấy', color: 0xe74c3c }],
          ephemeral: true
        });
      }

      await interaction.reply({
        embeds: [{
          title: `🔑 ${found.name}`,
          fields: [
            { name: 'Status', value: found.isActive ? '✅ Active' : '❌ Inactive', inline: true },
            { name: 'Tạo lúc', value: new Date(found.createdAt).toLocaleDateString('vi-VN'), inline: true },
            { name: 'Hết hạn', value: found.expiresAt ? new Date(found.expiresAt).toLocaleDateString('vi-VN') : 'Không', inline: true },
            { name: 'Limit/user/ngày', value: `${found.config.dailyLimitPerUser}`, inline: true },
            { name: 'Total requests', value: `${found.stats.totalRequests}`, inline: true },
            { name: 'Hôm nay', value: `${found.stats.todayRequests}`, inline: true },
          ],
          color: found.isActive ? 0x2ecc71 : 0xe74c3c,
          timestamp: new Date().toISOString()
        }],
        ephemeral: true
      });
      break;
    }

    case 'toggle': {
      const query = interaction.options.getString('key');
      const found = findApiKey(query);
      if (!found) {
        return interaction.reply({
          embeds: [{ title: '❌ Không tìm thấy', color: 0xe74c3c }],
          ephemeral: true
        });
      }

      const updated = await toggleApiKey(found.key);
      await interaction.reply({
        embeds: [{
          title: updated.isActive ? '✅ Đã bật API Key' : '❌ Đã tắt API Key',
          description: `**${updated.name}** đã được ${updated.isActive ? 'bật' : 'tắt'}.`,
          color: updated.isActive ? 0x2ecc71 : 0xe74c3c
        }],
        ephemeral: true
      });
      break;
    }

    case 'stats': {
      const query = interaction.options.getString('key');
      const found = findApiKey(query);
      if (!found) {
        return interaction.reply({
          embeds: [{ title: '❌ Không tìm thấy', color: 0xe74c3c }],
          ephemeral: true
        });
      }

      const stats = getApiKeyStatsToday(found.key);

      let userList = 'Không có user nào hôm nay.';
      if (stats.users && stats.users.length > 0) {
        userList = stats.users
          .sort((a, b) => b.requests - a.requests)
          .slice(0, 15)
          .map((u, i) => `${i + 1}. \`${u.userId}\` — ${u.requests} reqs`)
          .join('\n');
      }

      await interaction.reply({
        embeds: [{
          title: `📊 Stats: ${found.name}`,
          fields: [
            { name: 'Requests hôm nay', value: `${stats.totalRequests}`, inline: true },
            { name: 'Users hôm nay', value: `${stats.uniqueUsers}`, inline: true },
            { name: 'Cached', value: `${stats.cachedRequests}`, inline: true },
            { name: 'Top Users', value: userList.substring(0, 1024) },
          ],
          color: 0x3498db,
          timestamp: new Date().toISOString()
        }],
        ephemeral: true
      });
      break;
    }
  }
}

// ============================================================
// Quota Command (Admin)
// ============================================================

async function handleQuota(interaction) {
  if (!isOwner(interaction.user.id)) {
    return interaction.reply({
      embeds: [{ title: '❌ Không có quyền', color: 0xe74c3c }],
      ephemeral: true
    });
  }

  const quotas = getQuotaStatus();
  const cacheStats = getCacheStats();

  const keyList = quotas.map(q =>
    `**Key ${q.index}** \`${q.keyPreview}\`\n${q.status} | Used: ${q.usageToday} | Failures: ${q.failures}${q.cooldownLeft > 0 ? ` | CD: ${q.cooldownLeft}s` : ''}`
  ).join('\n\n');

  await interaction.reply({
    embeds: [{
      title: '📊 OpenRouter Quota Dashboard',
      description: keyList || 'Không có key nào.',
      fields: [
        { name: '💾 Cache', value: `${cacheStats.entries} entries | Hit: ${cacheStats.hitRate}% | Saves: ${cacheStats.sets}`, inline: false },
      ],
      color: 0x9b59b6,
      timestamp: new Date().toISOString()
    }],
    ephemeral: true
  });
}

// ============================================================
// Glossary Commands
// ============================================================

async function handleGlossary(interaction) {
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case 'list': {
      const glossary = getGlossary();
      const entries = Object.entries(glossary);
      const page = (interaction.options.getInteger('page') || 1) - 1;
      const perPage = 20;
      const totalPages = Math.ceil(entries.length / perPage);
      const start = page * perPage;
      const pageEntries = entries.slice(start, start + perPage);

      const list = pageEntries.map(([en, vi]) => `**${en}** → ${vi}`).join('\n');

      await interaction.reply({
        embeds: [{
          title: `📖 Thuật ngữ Minecraft (Trang ${page + 1}/${totalPages})`,
          description: list || 'Không có thuật ngữ.',
          footer: { text: `Tổng: ${entries.length} thuật ngữ | /glossary list page:<số>` },
          color: 0xf1c40f,
          timestamp: new Date().toISOString()
        }],
        ephemeral: true
      });
      break;
    }

    case 'add': {
      if (!isOwner(interaction.user.id)) {
        return interaction.reply({
          embeds: [{ title: '❌ Không có quyền', color: 0xe74c3c }],
          ephemeral: true
        });
      }

      const en = interaction.options.getString('en');
      const vi = interaction.options.getString('vi');
      await addTerm(en, vi);

      await interaction.reply({
        embeds: [{
          title: '✅ Đã thêm thuật ngữ',
          description: `**${en}** → **${vi}**`,
          color: 0x2ecc71
        }],
        ephemeral: true
      });
      break;
    }

    case 'remove': {
      if (!isOwner(interaction.user.id)) {
        return interaction.reply({
          embeds: [{ title: '❌ Không có quyền', color: 0xe74c3c }],
          ephemeral: true
        });
      }

      const en = interaction.options.getString('en');
      await removeTerm(en);

      await interaction.reply({
        embeds: [{
          title: '🗑️ Đã xoá thuật ngữ',
          description: `**${en}** đã được xoá/reset.`,
          color: 0xf39c12
        }],
        ephemeral: true
      });
      break;
    }
  }
}

async function handleSetChannel(interaction) {
  if (!interaction.member.permissions.has('Administrator') && !isOwner(interaction.user.id)) {
    return interaction.reply({
      embeds: [{ title: '❌ Không có quyền', color: 0xe74c3c }],
      ephemeral: true
    });
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel) {
    await setAllowedChannel(null);
    return interaction.reply({
      embeds: [{
        title: '✅ Đã gỡ giới hạn kênh',
        description: 'Lệnh `!viethoa` bây giờ có thể dùng ở mọi kênh.',
        color: 0x2ecc71
      }],
      ephemeral: true
    });
  }

  await setAllowedChannel(channel.id);
  return interaction.reply({
    embeds: [{
      title: '✅ Đã cập nhật cài đặt',
      description: `Lệnh \`!viethoa\` bây giờ chỉ được phép sử dụng ở kênh <#${channel.id}>.`,
      color: 0x2ecc71
    }],
    ephemeral: true
  });
}