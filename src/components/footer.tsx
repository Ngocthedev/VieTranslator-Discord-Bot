import React from 'react';
import { Bot, Github, Mail, MessageSquare } from 'lucide-react';
import { Container } from './ui/container';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t py-12 mt-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">VietHoa Bot</span>
            </div>
            <p className="text-sm text-gray-600 max-w-xs">
              Bot dịch thuật thông minh giúp Việt hóa các tệp cấu hình và ngôn ngữ của Minecraft.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 mb-4">Liên kết</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Trang chủ</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Tính năng</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Hướng dẫn</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Giới thiệu</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 mb-4">Tài nguyên</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Tài liệu API</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Mã nguồn</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Báo cáo lỗi</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Đóng góp</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 mb-4">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Github className="h-4 w-4 text-gray-600" />
                <a href="https://github.com/yourusername/viethoa-bot" className="text-gray-600 hover:text-primary transition-colors">GitHub</a>
              </li>
              <li className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-gray-600" />
                <a href="https://discord.gg/your-server" className="text-gray-600 hover:text-primary transition-colors">Discord</a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <a href="mailto:support@viethoa-bot.example.com" className="text-gray-600 hover:text-primary transition-colors">Email</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {currentYear} VietHoa Bot. Tất cả các quyền được bảo lưu.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
              Điều khoản sử dụng
            </a>
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
              Chính sách bảo mật
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}