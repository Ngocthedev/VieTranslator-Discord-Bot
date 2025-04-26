# VietHoa Bot - Bot Discord để dịch tệp Minecraft sang tiếng Việt

VietHoa Bot là một bot Discord được thiết kế để dịch các tệp cấu hình plugin Minecraft, tệp ngôn ngữ và các tệp mã khác sang tiếng Việt mà vẫn giữ nguyên cấu trúc mã. Bot sử dụng các mô hình AI như Gemini hoặc GPT để nhận diện thông minh những phần cần dịch và những phần nên giữ nguyên.

## Tính năng

- Dịch tệp cấu hình plugin Minecraft sang tiếng Việt  
- Giữ nguyên cấu trúc và chức năng mã  
- Hỗ trợ nhiều định dạng tệp (.yml, .json, .properties, .lang, .sk, v.v.)  
- Sử dụng các mô hình AI tiên tiến (Gemini 2.0 Flash hoặc GPT-4)  
- Hỗ trợ nhiều khóa API song song để dịch  
- Lệnh Discord đơn giản  
- Hoạt động cả trong kênh máy chủ và tin nhắn trực tiếp  

## Lệnh

### Lệnh người dùng
- `!viethoa` - Dịch tệp đính kèm sang tiếng Việt  
- `/ping` - Kiểm tra độ trễ phản hồi của bot  
- `/cai` - Hiển thị mô hình AI hiện đang sử dụng  
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
# Token Bot Discord
DISCORD_TOKEN=your_discord_bot_token_here

# Khóa API AI (có thể thêm nhiều khóa Gemini)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_1=your_second_gemini_api_key_here
GEMINI_API_KEY_2=your_third_gemini_api_key_here
# Thêm nhiều khóa Gemini nếu cần (tối đa GEMINI_API_KEY_9)
- bạn có thể lấy api key gemini tại `https://aistudio.google.com/apikey`
# Mô hình AI mặc định (openai hoặc gemini)
DEFAULT_AI_MODEL=gemini

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
