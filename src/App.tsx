import React, { useState } from 'react';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { HeroSection } from './components/hero-section';
import { FeaturesSection } from './components/features-section';
import { HowItWorksSection } from './components/how-it-works-section';
import { CommandsSection } from './components/commands-section';
import { TestimonialsSection } from './components/testimonials-section';
import { CTASection } from './components/cta-section';
import { Container } from './components/ui/container';
import { Section } from './components/ui/section';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Github } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'home' && (
        <>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <TestimonialsSection />
          <CTASection />
        </>
      )}

      {activeTab === 'features' && (
        <>
          <Section className="pt-24">
            <Container>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">Tính năng nổi bật</h1>
                <p className="text-xl text-gray-600">
                  VietHoa Bot được thiết kế với nhiều tính năng mạnh mẽ để đảm bảo quá trình Việt hóa diễn ra nhanh chóng và chính xác.
                </p>
              </div>
            </Container>
          </Section>
          <FeaturesSection />
          <CommandsSection />
          <Section className="bg-white">
            <Container>
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Xử lý song song</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      VietHoa Bot sử dụng kỹ thuật xử lý song song tiên tiến để tăng tốc quá trình dịch thuật:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      <li>Chia tệp thành nhiều phần nhỏ để xử lý đồng thời</li>
                      <li>Sử dụng nhiều API key để tăng tốc độ xử lý</li>
                      <li>Tự động phân phối tải giữa các API key</li>
                      <li>Tự động thử lại khi gặp lỗi với cơ chế backoff thông minh</li>
                      <li>Hàng đợi xử lý với giới hạn đồng thời để tránh quá tải</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Bảo toàn cấu trúc</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Bot đảm bảo tệp dịch giữ nguyên cấu trúc và chức năng của tệp gốc:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      <li>Giữ nguyên các khóa, biến và tham số kỹ thuật</li>
                      <li>Bảo toàn định dạng đặc biệt và mã màu</li>
                      <li>Tự động kiểm tra và sửa lỗi cấu trúc</li>
                      <li>Xác thực tệp dịch để đảm bảo tính hợp lệ</li>
                      <li>Phát hiện và sửa lỗi số dòng không khớp</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </Container>
          </Section>
          <CTASection />
        </>
      )}

      {activeTab === 'docs' && (
        <>
          <Section className="pt-24">
            <Container>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">Hướng dẫn sử dụng</h1>
                <p className="text-xl text-gray-600">
                  Tìm hiểu cách sử dụng VietHoa Bot để Việt hóa server Minecraft của bạn một cách hiệu quả.
                </p>
              </div>
            </Container>
          </Section>
          <Section>
            <Container>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <div className="sticky top-24">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Mục lục</h3>
                      <ul className="space-y-2">
                        <li>
                          <a href="#setup" className="text-primary hover:underline">Cài đặt bot</a>
                        </li>
                        <li>
                          <a href="#commands" className="text-primary hover:underline">Sử dụng lệnh</a>
                        </li>
                        <li>
                          <a href="#formats" className="text-primary hover:underline">Định dạng hỗ trợ</a>
                        </li>
                        <li>
                          <a href="#tips" className="text-primary hover:underline">Mẹo và thủ thuật</a>
                        </li>
                        <li>
                          <a href="#faq" className="text-primary hover:underline">Câu hỏi thường gặp</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-8">
                  <div id="setup" className="bg-white p-8 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Cài đặt bot</h2>
                    <ol className="space-y-4 text-gray-600">
                      <li className="flex items-start">
                        <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-white">1</span>
                        <div>
                          <p>Nhấp vào nút "Thêm vào Discord" ở trên cùng của trang.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-white">2</span>
                        <div>
                          <p>Chọn server Discord mà bạn muốn thêm bot vào.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-white">3</span>
                        <div>
                          <p>Cấp quyền cần thiết cho bot và xác nhận.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-white">4</span>
                        <div>
                          <p>Bot sẽ tự động tham gia server của bạn và sẵn sàng sử dụng.</p>
                        </div>
                      </li>
                    </ol>
                  </div>
                  
                  <div id="commands" className="bg-white p-8 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Sử dụng lệnh</h2>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Lệnh dịch cơ bản:</h3>
                      <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
                        !viethoa + đính kèm tệp cần dịch
                      </div>
                      <p className="mt-2 text-gray-600">
                        Gửi lệnh này kèm theo tệp cấu hình hoặc ngôn ngữ cần dịch. Bot sẽ xử lý và gửi lại tệp đã dịch.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Lệnh kiểm tra:</h3>
                      <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
                        /ping
                      </div>
                      <p className="mt-2 text-gray-600">
                        Kiểm tra độ trễ phản hồi của bot.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Kiểm tra mô hình AI:</h3>
                      <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
                        /cai
                      </div>
                      <p className="mt-2 text-gray-600">
                        Hiển thị mô hình AI hiện tại đang được sử dụng (Gemini hoặc GPT-4).
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Kiểm tra dịch văn bản:</h3>
                      <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
                        /test text:"Welcome to my server!"
                      </div>
                      <p className="mt-2 text-gray-600">
                        Dịch một đoạn văn bản ngắn để kiểm tra.
                      </p>
                    </div>
                  </div>
                  
                  <div id="formats" className="bg-white p-8 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Định dạng hỗ trợ</h2>
                    <p className="text-gray-600 mb-4">
                      VietHoa Bot hỗ trợ nhiều định dạng tệp phổ biến được sử dụng trong các plugin Minecraft:
                    </p>
                    <ul className="grid grid-cols-2 gap-2 text-gray-600">
                      <li className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        YAML (.yml, .yaml)
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        JSON (.json)
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        Properties (.properties)
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        Lang (.lang)
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        Config (.cfg, .conf)
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        INI (.ini)
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        Skript (.sk)
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        Text (.txt)
                      </li>
                    </ul>
                  </div>
                  
                  <div id="tips" className="bg-white p-8 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Mẹo và thủ thuật</h2>
                    <ul className="space-y-4 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-primary mr-2 mt-1">✓</span>
                        <div>
                          <p className="font-medium">Kiểm tra tệp đã dịch</p>
                          <p>Luôn kiểm tra tệp đã dịch trước khi sử dụng để đảm bảo không có lỗi.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2 mt-1">✓</span>
                        <div>
                          <p className="font-medium">Sao lưu tệp gốc</p>
                          <p>Luôn tạo bản sao lưu của tệp gốc trước khi thay thế bằng tệp đã dịch.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2 mt-1">✓</span>
                        <div>
                          <p className="font-medium">Dịch từng tệp một</p>
                          <p>Nếu bạn cần dịch nhiều tệp, hãy gửi từng tệp một với lệnh riêng biệt để tránh quá tải.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2 mt-1">✓</span>
                        <div>
                          <p className="font-medium">Sử dụng DM</p>
                          <p>Đảm bảo bot có thể gửi tin nhắn riêng (DM) cho bạn để nhận tệp đã dịch.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div id="faq" className="bg-white p-8 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Câu hỏi thường gặp</h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Bot không phản hồi khi tôi gửi lệnh?</h3>
                        <p className="text-gray-600">
                          Đảm bảo bot có quyền đọc và gửi tin nhắn trong kênh. Nếu bạn đang sử dụng danh sách trắng, hãy kiểm tra xem bạn có trong danh sách không.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Tôi không nhận được tệp đã dịch qua DM?</h3>
                        <p className="text-gray-600">
                          Kiểm tra cài đặt quyền riêng tư của bạn trên Discord. Đảm bảo bạn cho phép nhận tin nhắn từ thành viên server.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Tệp dịch có lỗi cú pháp?</h3>
                        <p className="text-gray-600">
                          Bot cố gắng bảo toàn cấu trúc tệp, nhưng đôi khi có thể xảy ra lỗi. Hãy báo cáo lỗi để chúng tôi cải thiện bot.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Làm thế nào để tăng số lượng API key?</h3>
                        <p className="text-gray-600">
                          Chỉ chủ sở hữu bot mới có thể thay đổi số lượng API key cho người dùng. Liên hệ với họ để được hỗ trợ.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </Section>
        </>
      )}

      {activeTab === 'about' && (
        <>
          <Section className="pt-24">
            <Container>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">Giới thiệu</h1>
                <p className="text-xl text-gray-600">
                  Tìm hiểu thêm về VietHoa Bot và đội ngũ phát triển.
                </p>
              </div>
            </Container>
          </Section>
          <Section>
            <Container>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Về VietHoa Bot</h2>
                  <p className="text-gray-600 mb-4">
                    VietHoa Bot được tạo ra với mục đích giúp cộng đồng Minecraft Việt Nam dễ dàng Việt hóa các plugin, mod và resource pack.
                    Bot sử dụng trí tuệ nhân tạo tiên tiến để dịch các tệp cấu hình và ngôn ngữ sang tiếng Việt một cách thông minh, 
                    đảm bảo giữ nguyên cấu trúc và chức năng của mã.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Dự án bắt đầu vào năm 2023 với mục tiêu đơn giản là giúp các admin server Minecraft Việt Nam
                    có thể dễ dàng Việt hóa các plugin mà không cần kiến thức chuyên sâu về lập trình hay dịch thuật.
                  </p>
                  <p className="text-gray-600">
                    Hiện tại, VietHoa Bot đang được sử dụng bởi hàng nghìn người dùng và đã dịch hàng chục nghìn tệp cấu hình và ngôn ngữ.
                  </p>
                </div>
                <div className="bg-gray-100 p-8 rounded-xl">
                  <h3 className="text-2xl font-bold mb-4">Công nghệ sử dụng</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <p className="font-medium">Discord.js</p>
                        <p className="text-sm">Thư viện tương tác với Discord API</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <p className="font-medium">Google Gemini API</p>
                        <p className="text-sm">Mô hình AI chính được sử dụng cho dịch thuật</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <p className="font-medium">OpenAI GPT-4</p>
                        <p className="text-sm">Mô hình AI thay thế cho dịch thuật</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <p className="font-medium">Node.js</p>
                        <p className="text-sm">Nền tảng runtime cho bot</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <p className="font-medium">React & Tailwind CSS</p>
                        <p className="text-sm">Phát triển giao diện người dùng</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-16">
                <h2 className="text-3xl font-bold mb-6">Đóng góp</h2>
                <p className="text-gray-600 mb-8">
                  VietHoa Bot là một dự án mã nguồn mở và chúng tôi luôn chào đón sự đóng góp từ cộng đồng. Bạn có thể đóng góp bằng nhiều cách:
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Báo cáo lỗi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Nếu bạn phát hiện lỗi hoặc vấn đề với bot, hãy báo cáo trên GitHub để chúng tôi có thể khắc phục.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Đề xuất tính năng</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Có ý tưởng để cải thiện bot? Hãy chia sẻ đề xuất của bạn trên GitHub hoặc Discord.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Đóng góp mã nguồn</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Nếu bạn là nhà phát triển, bạn có thể đóng góp mã nguồn thông qua pull request trên GitHub.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-8 flex justify-center">
                  <a 
                    href="https://github.com/yourusername/viethoa-bot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <Github className="h-5 w-5 mr-2" />
                    Xem mã nguồn trên GitHub
                  </a>
                </div>
              </div>
              
              <div className="mt-16">
                <h2 className="text-3xl font-bold mb-6">Liên hệ</h2>
                <p className="text-gray-600 mb-8">
                  Nếu bạn có câu hỏi, góp ý hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi qua các kênh sau:
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Discord</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Tham gia server Discord của chúng tôi để nhận hỗ trợ trực tiếp và cập nhật mới nhất.
                      </p>
                      <a 
                        href="https://discord.gg/your-server" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Tham gia server
                      </a>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Gửi email cho chúng tôi nếu bạn có câu hỏi hoặc đề xuất hợp tác.
                      </p>
                      <a 
                        href="mailto:support@viethoa-bot.example.com" 
                        className="text-primary hover:underline"
                      >
                        support@viethoa-bot.example.com
                      </a>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>GitHub</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Báo cáo lỗi, đề xuất tính năng hoặc đóng góp mã nguồn trên GitHub.
                      </p>
                      <a 
                        href="https://github.com/yourusername/viethoa-bot/issues" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Tạo issue
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Container>
          </Section>
        </>
      )}

      <Footer />
    </div>
  );
}

export default App;