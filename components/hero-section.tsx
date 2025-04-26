import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Container } from './ui/container';

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white py-16 sm:py-24 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[50%] top-0 h-[500px] w-[500px] -translate-x-[50%] translate-y-[-30%] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute right-0 bottom-0 h-[300px] w-[300px] translate-x-[30%] translate-y-[30%] rounded-full bg-primary/5 blur-3xl"></div>
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
              <Bot className="h-4 w-4 mr-2" />
              <span>Dịch thuật thông minh cho Minecraft</span>
            </div>
            
            <motion.h1 
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Việt hóa <span className="text-primary">dễ dàng</span> cho các plugin Minecraft
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              VietHoa Bot giúp dịch các tệp cấu hình và ngôn ngữ của Minecraft sang tiếng Việt một cách thông minh, 
              đảm bảo giữ nguyên cấu trúc và chức năng của mã.
            </motion.p>
            
            <motion.div 
              className="mt-10 flex items-center justify-center gap-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <a 
                href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gap-2">
                  Thêm vào Discord
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Button variant="outline" size="lg">Xem hướng dẫn</Button>
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          className="mt-16 relative mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="bg-gray-800 px-4 py-2 flex items-center">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="ml-4 text-gray-300 text-sm">Discord - #minecraft-server</div>
            </div>
            <div className="p-6 bg-gray-900 text-white">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-gray-800 rounded-lg p-3 max-w-md">
                  <p className="text-sm text-gray-300">Gửi <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">!viethoa</code> kèm theo tệp cấu hình để dịch sang tiếng Việt.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 mb-4 justify-end">
                <div className="bg-primary/10 rounded-lg p-3 max-w-md">
                  <p className="text-sm text-primary-200">
                    <span className="text-xs text-gray-400 block mb-1">User#1234</span>
                    !viethoa
                    <span className="text-xs text-gray-400 block mt-1">📎 config.yml</span>
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">U</span>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-gray-800 rounded-lg p-3 max-w-md">
                  <div className="flex items-center mb-2">
                    <div className="w-4 h-4 mr-2 text-green-400">✓</div>
                    <p className="text-sm font-medium text-green-400">Dịch hoàn tất</p>
                  </div>
                  <p className="text-sm text-gray-300">Bản dịch đã được gửi qua tin nhắn riêng (DM).</p>
                  <div className="mt-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Tệp gốc:</span>
                      <span>config.yml</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tệp đã dịch:</span>
                      <span>vietnamese_config.yml</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}