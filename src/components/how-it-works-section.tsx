import React from 'react';
import { motion } from 'framer-motion';
import { Container } from './ui/container';
import { Section } from './ui/section';
import { ArrowRight, Bot, FileText, MessageSquare, CheckCircle } from 'lucide-react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

const steps = [
  {
    icon: <Bot className="h-8 w-8 text-white" />,
    title: "Thêm bot vào server",
    description: "Thêm VietHoa Bot vào server Discord của bạn thông qua liên kết mời."
  },
  {
    icon: <FileText className="h-8 w-8 text-white" />,
    title: "Gửi tệp cần dịch",
    description: "Sử dụng lệnh !viethoa và đính kèm tệp cấu hình hoặc ngôn ngữ cần dịch."
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-white" />,
    title: "Nhận tệp đã dịch",
    description: "Bot sẽ gửi tệp đã dịch qua tin nhắn riêng (DM) hoặc trong kênh."
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-white" />,
    title: "Sử dụng bản dịch",
    description: "Tải tệp đã dịch và sử dụng trong server Minecraft của bạn."
  }
];

export function HowItWorksSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <Section className="bg-gray-50">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Cách sử dụng</h2>
          <p className="text-lg text-gray-600">
            Việt hóa plugin Minecraft chưa bao giờ dễ dàng đến thế. Chỉ với vài bước đơn giản, bạn có thể có bản dịch tiếng Việt chất lượng cao.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>

          <div className="space-y-12 relative">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className={`md:grid md:grid-cols-2 md:gap-8 items-center ${index % 2 === 1 ? 'md:rtl' : ''}`}>
                  <div className={`md:ltr ${index % 2 === 1 ? 'md:text-right' : ''}`}>
                    <div className="bg-white p-6 rounded-xl shadow-lg relative z-10">
                      <div className="absolute -top-3 -left-3 md:top-1/2 md:-translate-y-1/2 md:-left-5 w-10 h-10 rounded-full bg-primary flex items-center justify-center z-20">
                        {step.icon}
                      </div>
                      <div className={`pl-8 md:pl-0 ${index % 2 === 1 ? 'md:pr-8' : ''}`}>
                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <div className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className="w-16 h-16 flex items-center justify-center">
                        <ArrowRight className={`h-8 w-8 text-primary ${index % 2 === 1 ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div ref={ref} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {inView ? (
            <>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <CountUp 
                  end={1000} 
                  suffix="+" 
                  duration={2.5} 
                  className="text-4xl font-bold text-primary"
                />
                <p className="text-gray-600 mt-2">Người dùng</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <CountUp 
                  end={5000} 
                  suffix="+" 
                  duration={2.5} 
                  className="text-4xl font-bold text-primary"
                />
                <p className="text-gray-600 mt-2">Tệp đã dịch</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <CountUp 
                  end={50} 
                  suffix="+" 
                  duration={2.5} 
                  className="text-4xl font-bold text-primary"
                />
                <p className="text-gray-600 mt-2">Server sử dụng</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <CountUp 
                  end={99.8} 
                  suffix="%" 
                  decimals={1}
                  duration={2.5} 
                  className="text-4xl font-bold text-primary"
                />
                <p className="text-gray-600 mt-2">Độ chính xác</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="text-4xl font-bold text-primary">0+</div>
                <p className="text-gray-600 mt-2">Người dùng</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="text-4xl font-bold text-primary">0+</div>
                <p className="text-gray-600 mt-2">Tệp đã dịch</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="text-4xl font-bold text-primary">0+</div>
                <p className="text-gray-600 mt-2">Server sử dụng</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="text-4xl font-bold text-primary">0%</div>
                <p className="text-gray-600 mt-2">Độ chính xác</p>
              </div>
            </>
          )}
        </div>
      </Container>
    </Section>
  );
}