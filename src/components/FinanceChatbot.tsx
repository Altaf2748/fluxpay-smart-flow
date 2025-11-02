import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const FinanceChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your FluxPay Finance Assistant. I can help you with:\n\n• Finding better deals and cashback offers\n• Advice on reducing spending and saving more\n• Comparing loans and financial products for students\n• Analyzing your spending patterns\n\nHow can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('finance-chat', {
        body: { messages: [...messages, userMessage] }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">Finance Assistant</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Your personal financial advisor</p>
        </div>
      </div>

      <Card className="h-[calc(100vh-12rem)] sm:h-[600px] max-h-[800px] flex flex-col">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            Chat
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Ask me anything about finance, savings, loans, or deals
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea ref={scrollRef} className="flex-1 px-3 sm:px-4 md:px-6">
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] rounded-lg px-3 py-2 sm:px-4 sm:py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 sm:px-4 sm:py-3">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-3 sm:p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about finance, deals, savings..."
                disabled={loading}
                className="flex-1 h-10 sm:h-11 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                size="icon"
                className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
