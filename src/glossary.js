import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GLOSSARY_PATH = path.join(__dirname, '../data/glossary.json');

// Default Minecraft glossary EN → VI
const DEFAULT_GLOSSARY = {
  // === Gameplay ===
  "Player": "Người chơi",
  "Players": "Người chơi",
  "Health": "Máu",
  "Hearts": "Trái tim",
  "Mana": "Mana",
  "Hunger": "Đói",
  "Experience": "Kinh nghiệm",
  "XP": "KN",
  "Level": "Cấp độ",
  "Score": "Điểm",
  "Lives": "Mạng",
  "Spawn": "Hồi sinh",
  "Respawn": "Hồi sinh",
  "Death": "Chết",
  "Kill": "Giết",
  "Damage": "Sát thương",
  "Attack": "Tấn công",
  "Defense": "Phòng thủ",
  "Speed": "Tốc độ",
  "Strength": "Sức mạnh",

  // === Items & Inventory ===
  "Inventory": "Túi đồ",
  "Item": "Vật phẩm",
  "Items": "Vật phẩm",
  "Stack": "Chồng",
  "Chest": "Rương",
  "Ender Chest": "Rương Ender",
  "Armor": "Giáp",
  "Weapon": "Vũ khí",
  "Sword": "Kiếm",
  "Bow": "Cung",
  "Arrow": "Mũi tên",
  "Shield": "Khiên",
  "Tool": "Công cụ",
  "Pickaxe": "Cuốc",
  "Axe": "Rìu",
  "Shovel": "Xẻng",
  "Hoe": "Cuốc chim",
  "Helmet": "Mũ",
  "Chestplate": "Áo giáp",
  "Leggings": "Quần giáp",
  "Boots": "Giày",

  // === World & Building ===
  "World": "Thế giới",
  "Block": "Khối",
  "Blocks": "Khối",
  "Biome": "Quần xã",
  "Chunk": "Chunk",
  "Region": "Vùng",
  "Dimension": "Chiều không gian",
  "Overworld": "Thế giới bề mặt",
  "Nether": "Địa ngục",
  "End": "The End",
  "Village": "Làng",
  "Structure": "Công trình",
  "Dungeon": "Hầm ngục",

  // === Crafting & Enchanting ===
  "Crafting": "Chế tạo",
  "Smelting": "Nung",
  "Enchantment": "Phù phép",
  "Enchant": "Phù phép",
  "Potion": "Thuốc",
  "Effect": "Hiệu ứng",
  "Recipe": "Công thức",
  "Anvil": "Đe",
  "Furnace": "Lò nung",
  "Brewing": "Pha chế",

  // === Mobs & Entities ===
  "Mob": "Mob",
  "Mobs": "Mob",
  "NPC": "NPC",
  "Entity": "Thực thể",
  "Boss": "Boss",
  "Pet": "Thú cưng",
  "Villager": "Dân làng",
  "Zombie": "Zombie",
  "Skeleton": "Skeleton",
  "Creeper": "Creeper",
  "Enderman": "Enderman",

  // === Server & Admin ===
  "Server": "Máy chủ",
  "Plugin": "Plugin",
  "Permission": "Quyền",
  "Permissions": "Quyền",
  "Command": "Lệnh",
  "Commands": "Lệnh",
  "Console": "Console",
  "Admin": "Quản trị",
  "Operator": "OP",
  "Ban": "Cấm",
  "Banned": "Bị cấm",
  "Kick": "Đuổi",
  "Kicked": "Bị đuổi",
  "Mute": "Cấm chat",
  "Muted": "Bị cấm chat",
  "Warn": "Cảnh cáo",
  "Warning": "Cảnh cáo",
  "Whitelist": "Danh sách trắng",
  "Blacklist": "Danh sách đen",

  // === Communication ===
  "Broadcast": "Thông báo",
  "Message": "Tin nhắn",
  "Chat": "Chat",
  "Announcement": "Thông báo",
  "Notification": "Thông báo",
  "Title": "Tiêu đề",
  "Subtitle": "Phụ đề",
  "Actionbar": "Thanh hành động",

  // === Economy ===
  "Money": "Tiền",
  "Balance": "Số dư",
  "Bank": "Ngân hàng",
  "Shop": "Cửa hàng",
  "Buy": "Mua",
  "Sell": "Bán",
  "Price": "Giá",
  "Cost": "Chi phí",
  "Economy": "Kinh tế",
  "Transaction": "Giao dịch",
  "Withdraw": "Rút",
  "Deposit": "Nạp",

  // === Movement & Teleport ===
  "Teleport": "Dịch chuyển",
  "Warp": "Dịch chuyển",
  "Home": "Nhà",
  "Homes": "Nhà",
  "Sethome": "Đặt nhà",
  "Back": "Quay lại",
  "Fly": "Bay",
  "Sprint": "Chạy nhanh",
  "Sneak": "Lén",
  "Jump": "Nhảy",

  // === Groups & Ranks ===
  "Rank": "Cấp bậc",
  "Group": "Nhóm",
  "Prefix": "Tiền tố",
  "Suffix": "Hậu tố",
  "Member": "Thành viên",
  "Owner": "Chủ sở hữu",
  "Moderator": "Điều hành viên",
  "Helper": "Trợ giúp",
  "Default": "Mặc định",
  "VIP": "VIP",

  // === Time & Events ===
  "Cooldown": "Thời gian chờ",
  "Timer": "Bộ đếm",
  "Countdown": "Đếm ngược",
  "Duration": "Thời lượng",
  "Delay": "Độ trễ",
  "Event": "Sự kiện",
  "Reward": "Phần thưởng",
  "Rewards": "Phần thưởng",
  "Quest": "Nhiệm vụ",
  "Mission": "Nhiệm vụ",
  "Task": "Công việc",
  "Daily": "Hàng ngày",

  // === UI / Status ===
  "Enabled": "Bật",
  "Disabled": "Tắt",
  "On": "Bật",
  "Off": "Tắt",
  "Yes": "Có",
  "No": "Không",
  "True": "Đúng",
  "False": "Sai",
  "Success": "Thành công",
  "Failed": "Thất bại",
  "Error": "Lỗi",
  "Loading": "Đang tải",
  "Saving": "Đang lưu",
  "Saved": "Đã lưu",
  "Reloaded": "Đã tải lại",
  "Updated": "Đã cập nhật",
  "Cancelled": "Đã huỷ",
  "Confirmed": "Đã xác nhận",
  "Denied": "Bị từ chối",
  "Allowed": "Được phép",
  "Available": "Có sẵn",
  "Unavailable": "Không có sẵn",
  "Online": "Trực tuyến",
  "Offline": "Ngoại tuyến",
  "AFK": "AFK",

  // === Misc ===
  "Config": "Cấu hình",
  "Configuration": "Cấu hình",
  "Settings": "Cài đặt",
  "Options": "Tuỳ chọn",
  "Help": "Trợ giúp",
  "Info": "Thông tin",
  "Information": "Thông tin",
  "Usage": "Cách dùng",
  "Version": "Phiên bản",
  "Author": "Tác giả",
  "Description": "Mô tả",
  "Name": "Tên",
  "Type": "Loại",
  "Amount": "Số lượng",
  "Chance": "Tỉ lệ",
  "Radius": "Bán kính",
  "Location": "Vị trí",
  "Coordinates": "Toạ độ",
};

let glossary = { ...DEFAULT_GLOSSARY };

/**
 * Load glossary from file (merge with defaults)
 */
export async function loadGlossary() {
  try {
    await fs.ensureDir(path.dirname(GLOSSARY_PATH));
    if (await fs.pathExists(GLOSSARY_PATH)) {
      const custom = await fs.readJson(GLOSSARY_PATH);
      glossary = { ...DEFAULT_GLOSSARY, ...custom };
    } else {
      await fs.writeJson(GLOSSARY_PATH, {}, { spaces: 2 });
    }
    console.log(`📖 Glossary loaded: ${Object.keys(glossary).length} terms`);
  } catch (error) {
    console.error('Error loading glossary:', error.message);
  }
}

/**
 * Get the full glossary
 */
export function getGlossary() {
  return { ...glossary };
}

/**
 * Add a term to the glossary
 */
export async function addTerm(en, vi) {
  glossary[en] = vi;
  // Save custom terms (only non-default ones)
  const custom = {};
  for (const [key, value] of Object.entries(glossary)) {
    if (DEFAULT_GLOSSARY[key] !== value || !DEFAULT_GLOSSARY[key]) {
      custom[key] = value;
    }
  }
  await fs.writeJson(GLOSSARY_PATH, custom, { spaces: 2 });
  return true;
}

/**
 * Remove a custom term
 */
export async function removeTerm(en) {
  if (DEFAULT_GLOSSARY[en]) {
    glossary[en] = DEFAULT_GLOSSARY[en]; // Reset to default
  } else {
    delete glossary[en];
  }
  const custom = {};
  for (const [key, value] of Object.entries(glossary)) {
    if (DEFAULT_GLOSSARY[key] !== value || !DEFAULT_GLOSSARY[key]) {
      custom[key] = value;
    }
  }
  await fs.writeJson(GLOSSARY_PATH, custom, { spaces: 2 });
  return true;
}

/**
 * Build glossary text for AI prompt (compact format)
 */
export function buildGlossaryPrompt() {
  const entries = Object.entries(glossary)
    .map(([en, vi]) => `${en}=${vi}`)
    .join(', ');
  return `GLOSSARY: ${entries}`;
}
