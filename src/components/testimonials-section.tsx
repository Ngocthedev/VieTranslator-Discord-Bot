import React from 'react';
import { motion } from 'framer-motion';
import { Container } from './ui/container';
import { Section } from './ui/section';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "VietHoa Bot đã giúp tôi tiết kiệm hàng giờ đồng hồ dịch thuật thủ công. Các bản dịch rất chính xác và giữ nguyên cấu trúc tệp.",
    author: "MinecraftVN",
    role: "Quản trị viên Server"
  },
  {
    quote: "Tôi đã thử nhiều công cụ dịch khác nhau, nhưng VietHoa Bot là công cụ duy nhất có thể xử lý đúng các tệp cấu hình phức tạp của plugin.",
    author: "MCVietnam",
    role: "Nhà phát triển Plugin"
  },
  {
    quote: "Người chơi trên server của tôi rất thích giao diện tiếng Việt. VietHoa Bot đã giúp tôi Việt hóa toàn bộ server chỉ trong vài giờ.",
    author: "VNCraft",
    role: "Chủ sở hữu Server"
  },
  {
    quote: "Khả năng xử lý song song của bot thực sự ấn tượng. Tôi có thể dịch các tệp lớn trong vài phút thay vì phải chờ hàng giờ.",
    author: "SpigotVN",
    role: "Người đóng góp cộng đồng"
  }
];

export function TestimonialsSection() {
  return (
    <Section className="bg-gray-50">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Người dùng nói gì về chúng tôi</h2>
          <p className="text-lg text-gray-600">
            Hàng nghìn người dùng đã tin tưởng VietHoa Bot để Việt hóa server Minecraft của họ.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-white p-8 rounded-xl shadow-md relative">
                <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/10" />
                <div className="relative">
                  <p className="text-gray-700 italic mb-6 relative z-10">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}