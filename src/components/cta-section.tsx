import React from 'react';
import { motion } from 'framer-motion';
import { Container } from './ui/container';
import { Section } from './ui/section';
import { Button } from './ui/button';
import { ArrowRight, Bot } from 'lucide-react';

export function CTASection() {
  return (
    <Section className="bg-primary-50">
      <Container>
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute right-0 bottom-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-primary/10 blur-3xl"></div>
            <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl"></div>
          </div>

          <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl px-6 py-16 md:p-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center p-2 mb-6 rounded-full bg-white/10 text-white">
                <Bot className="h-6 w-6 mr-2" />
                <span className="font-medium">VietHoa Bot</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Bắt đầu Việt hóa server Minecraft của bạn ngay hôm nay
              </h2>
              
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                Thêm VietHoa Bot vào server Discord của bạn và bắt đầu dịch các tệp cấu hình và ngôn ngữ sang tiếng Việt một cách nhanh chóng và chính xác.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                  href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                    Thêm vào Discord
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Tìm hiểu thêm
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </Section>
  );
}