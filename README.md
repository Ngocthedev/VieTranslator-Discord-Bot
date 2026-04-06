# VietHoa Bot - Bot Discord để dịch tệp Minecraft sang tiếng Việt

VietHoa Bot là một bot Discord được thiết kế để dịch các tệp cấu hình plugin Minecraft, tệp ngôn ngữ và các tệp mã khác sang tiếng Việt mà vẫn giữ nguyên cấu trúc mã. Bot sử dụng các mô hình AI như Gemini hoặc GPT để nhận diện thông minh những phần cần dịch và những phần nên giữ nguyên.

## Tính năng

- Dịch tệp cấu hình plugin Minecraft sang tiếng Việt  
- Giữ nguyên cấu trúc và chức năng mã  
- Hỗ trợ nhiều định dạng tệp (.yml, .json, .properties, .lang, .sk, v.v.)  
- Sử dụng các mô hình AI tiên tiến tại   
- Hỗ trợ nhiều khóa API song song để dịch  
- Lệnh Discord đơn giản  
- Hoạt động cả trong kênh máy chủ và tin nhắn trực tiếp

## Bot API
- Hiện tại với V2.0, bot đã hỗ trợ Endpoint riêng khi host bot, hỗ trợ một số studio trong việc làm web dịch.
- khi host bot thành công người dùng cần dùng lệnh để tạo key api để web có thể sử dụng endpoint của bot.
## Lệnh

### Lệnh người dùng
- `!viethoa` - Dịch tệp đính kèm sang tiếng Việt  
- `/ping` - Kiểm tra độ trễ phản hồi của bot    
- `/test` - Thử dịch một đoạn văn ngắn  
- `/help` - Hiện các lệnh và cách dùng bot
## Cài đặt

1. Clone repository này  
2. Cài đặt các phụ thuộc với `npm install`  
3. Tạo tệp `.env` dựa trên `.env.example` và điền token Discord, khóa API AI và ID chủ bot  
4. Khởi động bot với `npm start`  

## Biến môi trường

Tạo tệp `.env` với các biến sau:

\`\`\`
# Discord Bot Token
DISCORD_TOKEN=

# AI API Keys
OPENROUTER_API_KEY=
OPENROUTER_API_KEY_1=
OPENROUTER_API_KEY_2=
OPENROUTER_API_KEY_3=
OPENROUTER_API_KEY_4=
OPENROUTER_API_KEY_5=
# Thêm nhiều api key OpenRouter nếu cần
- bạn có thể lấy api key OpenRouter tại `(https://openrouter.ai/workspaces/default/keys)`
# Mô hình AI mặc định
DEFAULT_AI_MODEL=stepfun/step-3.5-flash:free

# ID chủ bot (cho lệnh quản trị)
BOT_OWNER_ID=your_discord_user_id_here
\`\`\`
- Bạn có thể thêm một người dùng khác để sử dụng bot bằng cách thêm một dòng BOT_OWNER_ID xuống bên dưới và thêm id người dùng mà bạn muốn sử dụng bot vào

## Định dạng tệp hỗ trợ
- YAML (.yml, .yaml)  
- JSON (.json)  
- Properties (.properties, .lang)  
- Tệp cấu hình (.cfg, .conf, .config, .ini)  
- Tệp Skript (.sk)  
- Tệp văn bản (.txt)  
- Và nhiều hơn nữa  

## Cách cài đặt bot và chạy bot
1. `git clone https://github.com/Ngocthedev/VieTranslator-Discord-Bot.git`
2. `cd VieTranslator-Discord-Bot`
3. `npm install`
4. truy cập tệp .env trong file bot, thêm token bot, api key gemini (không cần thêm cả 9 hay 10 key), thêm bot owner id để sử dụng bot.
5. `npm start` hoặc `npm run dev` nếu lệnh start không hoạt động.
## Cách hoạt động
1. Người dùng gửi tệp kèm lệnh `!viethoa`  
2. Bot kiểm tra xem người dùng có được phép sử dụng bot không (id người dùng nằm trong mục .env dòng Owner ID)  
3. Bot tải xuống và xử lý tệp  
4. Bot xác định số lượng khóa API người dùng được phép sử dụng  
5. Bot chia tệp thành các đoạn và gửi song song đến dịch vụ AI  
6. AI dịch văn bản đồng thời giữ nguyên cấu trúc mã  
7. Bot ghép các đoạn đã dịch và kiểm tra tính toàn vẹn của bản dịch  
8. Bot gửi tệp đã dịch lại cho người dùng qua DM  
9. Bot dọn dẹp các tệp tạm  
## DONATE ỦNG HỘ DEV
  - STK MB BANK: 23201913121817 
