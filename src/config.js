import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configFile = path.join(__dirname, '../data/bot-config.json');

let config = {
  allowedChannelId: null
};

export async function loadConfig() {
  await fs.ensureFile(configFile);
  try {
    const data = await fs.readJson(configFile);
    config = { ...config, ...data };
  } catch (err) {
    // File empty or invalid, write default
    await saveConfig();
  }
}

export async function saveConfig() {
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export function getConfig() {
  return config;
}

export async function setAllowedChannel(channelId) {
  config.allowedChannelId = channelId;
  await saveConfig();
}
