import React from 'react';
import { motion } from 'framer-motion';
import { Container } from './ui/container';
import { Section } from './ui/section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Languages, FileCode, Cpu, Zap, Shield, Code } from 'lucide-react';

const features = [
  {
    icon: <Languages className="h-10 w-10 text-primary" />,
    title: 'Dịch thông minh',
    description: 'Phân biệt giữa nội dung cần dịch và mã cần giữ nguyên, đảm bảo tệp vẫn hoạt động sau khi dịch.'
  },
  {
    icon: <FileCode className="h-10 w-10 text-primary" />,
    title: 'Hỗ trợ nhiều định dạng',
    description: 'Hỗ trợ YAML, JSON, Properties, Lang, Config, Skript và nhiều định dạng tệp phổ biến khác.'
  },
  {
    icon: <Cpu className="h-10 w-10 text-primary" />,
    title: 'AI tiên tiến',
    description: 'Sử dụng Gemini 2.0 Flash hoặc GPT-4 để đảm bảo chất lượng dịch thuật cao nhất.'
  },
  {
    icon: <Zap className="h-10 w-10 text-primary" />,
    title: 'Xử lý song song',
    description: 'Dịch nhiều phần của tệp cùng lúc với nhiều API key, giúp tăng tốc độ xử lý.'
  },
  {
    icon: <Shield className="h-10 w-10 text-primary" />,
    title: 'Quản lý người dùng',
    description: 'Hệ thống danh sách trắng và đen để kiểm soát quyền truy cập vào bot.'
  },
  {
    icon: <Code className="h-10 w-10 text-primary" />,
    title: 'Bảo toàn cấu trúc',
    description: 'Tự động kiểm tra và sửa lỗi để đảm bảo tệp dịch giữ nguyên cấu trúc và chức năng.'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function FeaturesSection() {
  return (
    <Section className="bg-white">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Tính năng nổi bật</h2>
          <p className="text-lg text-gray-600">
            VietHoa Bot được thiết kế với nhiều tính năng mạnh mẽ để đảm bảo quá trình Việt hóa diễn ra nhanh chóng và chính xác.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {index === 0 && (
                      <>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          Dịch văn bản hiển thị cho người dùng
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          Giữ nguyên các khóa, biến và tham số kỹ thuật
                        </li>
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          YAML (.yml, .yaml)
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          JSON, Properties, Lang, Config, Skript
                        </li>
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          Gemini 2.0 Flash (mặc định)
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          OpenAI GPT-4 (tùy chọn)
                        </li>
                      </>
                    )}
                    {index === 3 && (
                      <>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          Xử lý nhiều phần đồng thời
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          Tự động phân phối tải giữa các API key
                        </li>
                      </>
                    )}
                    {index === 4 && (
                      <>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          Danh sách trắng và đen
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          Quản lý số lượng API key cho mỗi người dùng
                        </li>
                      </>
                    )}
                    {index === 5 && (
                      <>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          Tự động kiểm tra và sửa lỗi cấu trúc
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary mr-2">✓</span>
                          Bảo toàn định dạng đặc biệt và mã màu
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}