import React, { useState, useEffect } from 'react';
import { Bot, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Container } from './ui/container';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'features', label: 'Tính năng' },
    { id: 'docs', label: 'Hướng dẫn' },
    { id: 'about', label: 'Giới thiệu' },
  ];

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">VietHoa Bot</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => setActiveTab(item.id)}
                className={`${
                  activeTab === item.id 
                    ? 'text-primary border-b-2 border-primary rounded-none' 
                    : 'text-foreground/70 hover:text-foreground'
                } px-3 py-2`}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <a 
              href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:block"
            >
              <Button>Thêm vào Discord</Button>
            </a>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </Container>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-b"
          >
            <Container>
              <div className="py-4 space-y-1">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`${
                      activeTab === item.id ? 'text-primary bg-primary/5' : 'text-foreground/70'
                    } w-full justify-start`}
                  >
                    {item.label}
                  </Button>
                ))}
                <div className="pt-2">
                  <a 
                    href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full">Thêm vào Discord</Button>
                  </a>
                </div>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}