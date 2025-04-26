import React from 'react';
import { motion } from 'framer-motion';
import { Container } from './ui/container';
import { Section } from './ui/section';
import { Badge } from './ui/badge';
import { Terminal, User, Shield } from 'lucide-react';

const userCommands = [
  {
    command: "!viethoa",
    description: "Dịch tệp đính kèm sang tiếng Việt",
    example: "!viethoa + đính kèm tệp config.yml"
  },
  {
    command: "/ping",
    description: "Kiểm tra độ trễ phản hồi của bot",
    example: "/ping"
  },
  {
    command: "/cai",
    description: "Hiển thị mô hình AI hiện tại đang được sử dụng",
    example: "/cai"
  },
  {
    command: "/test",
    description: "Kiểm tra dịch văn bản ngắn",
    example: "/test text:\"Welcome to my server!\""
  }
];

const adminCommands = [
  {
    command: "/wl",
    description: "Thêm người dùng vào danh sách trắng",
    example: "/wl user:123456789 duration:30d"
  },
  {
    command: "/bl",
    description: "Thêm người dùng vào danh sách đen",
    example: "/bl user:123456789 duration:7d"
  },
  {
    command: "/rwl",
    description: "Xóa người dùng khỏi danh sách trắng",
    example: "/rwl user:123456789"
  },
  {
    command: "/rbl",
    description: "Xóa người dùng khỏi danh sách đen",
    example: "/rbl user:123456789"
  },
  {
    command: "/mkey",
    description: "Đặt số lượng API key tối đa cho người dùng",
    example: "/mkey user:123456789 keys:3"
  },
  {
    command: "/rmkey",
    description: "Giảm số lượng API key của người dùng",
    example: "/rmkey user:123456789 keys:1"
  }
];

export function CommandsSection() {
  return (
    <Section className="bg-white">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Lệnh Discord</h2>
          <p className="text-lg text-gray-600">
            VietHoa Bot cung cấp nhiều lệnh hữu ích để tương tác và quản lý quá trình dịch thuật.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-primary p-4 flex items-center">
                <User className="h-6 w-6 text-white mr-2" />
                <h3 className="text-xl font-bold text-white">Lệnh người dùng</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">Các lệnh có thể được sử dụng bởi tất cả người dùng (tùy thuộc vào cài đặt danh sách trắng/đen).</p>
                
                <div className="space-y-6">
                  {userCommands.map((cmd, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start">
                        <Badge className="mt-0.5">{cmd.command}</Badge>
                        <p className="ml-3 text-gray-700">{cmd.description}</p>
                      </div>
                      <div className="mt-2 bg-gray-50 p-2 rounded text-sm text-gray-600 font-mono">
                        {cmd.example}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gray-800 p-4 flex items-center">
                <Shield className="h-6 w-6 text-white mr-2" />
                <h3 className="text-xl font-bold text-white">Lệnh quản trị</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">Các lệnh chỉ có thể được sử dụng bởi chủ sở hữu bot hoặc quản trị viên.</p>
                
                <div className="space-y-6">
                  {adminCommands.map((cmd, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start">
                        <Badge variant="secondary" className="mt-0.5">{cmd.command}</Badge>
                        <p className="ml-3 text-gray-700">{cmd.description}</p>
                      </div>
                      <div className="mt-2 bg-gray-50 p-2 rounded text-sm text-gray-600 font-mono">
                        {cmd.example}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 bg-gray-50 p-6 rounded-xl border border-gray-200"
        >
          <div className="flex items-start">
            <Terminal className="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-semibold mb-2">Mẹo sử dụng</h4>
              <p className="text-gray-600 mb-4">
                Khi sử dụng lệnh <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm">!viethoa</code>, hãy đảm bảo rằng:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Tệp đính kèm có định dạng được hỗ trợ (.yml, .json, .properties, .lang, .cfg, .conf, .config, .ini, .sk, .txt)</li>
                <li>Kích thước tệp không vượt quá 10MB</li>
                <li>Bot có quyền gửi tin nhắn riêng (DM) cho bạn</li>
                <li>Nếu bạn muốn dịch nhiều tệp, hãy gửi từng tệp một với lệnh riêng biệt</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}