import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, Terminal, AlertCircle, User, Bot, Trash2, PanelRightClose, PanelRightOpen } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function App() {
  const [baseUrl, setBaseUrl] = useState('https://vrgrfa-myaicompanypublic.hf.space/v1');
  const [modelId, setModelId] = useState('gemma3:12b');
  const [apiKey, setApiKey] = useState('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');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, error]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setError(null);
    setRawResponse(null);

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`404 Not Found: The endpoint ${endpoint} does not exist. Please verify your HF Space route and Base URL.`);
        }
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      setRawResponse(data);

      const assistantMsg = data.choices?.[0]?.message?.content || "";
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);

    } catch (err: any) {
      console.error("Chat Error:", err);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError("Connection Refused / Failed to fetch. This usually means the HF Space is down, sleeping, the URL is incorrect, or CORS is blocking the request.");
      } else {
        setError(err.message || "An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0E1117] text-[#FAFAFA] font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-[320px] bg-[#1A1D24] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-8 text-[#FAFAFA]">
            <Settings className="w-6 h-6 text-[#4F8BFF]" />
            <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[0.8rem] text-[#A3A8B8] uppercase tracking-[0.5px] mb-1">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#262730] border border-white/10 text-[#FAFAFA] rounded-lg focus:outline-none focus:border-[#4F8BFF] text-[0.9rem] font-mono"
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div>
              <label className="block text-[0.8rem] text-[#A3A8B8] uppercase tracking-[0.5px] mb-1">Model ID</label>
              <input
                type="text"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#262730] border border-white/10 text-[#FAFAFA] rounded-lg focus:outline-none focus:border-[#4F8BFF] text-[0.9rem] font-mono"
                placeholder="gpt-3.5-turbo"
              />
            </div>

            <div>
              <label className="block text-[0.8rem] text-[#A3A8B8] uppercase tracking-[0.5px] mb-1">API Secret Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#262730] border border-white/10 text-[#FAFAFA] rounded-lg focus:outline-none focus:border-[#4F8BFF] text-[0.9rem] font-mono"
                placeholder="sk-..."
              />
            </div>
            
            <div className="text-[0.75rem] px-2 py-1 rounded bg-[#4F8BFF]/10 text-[#4F8BFF] w-fit">Connected to Space</div>
          </div>
        </div>
        
        <div className="p-6 pt-0 flex flex-col gap-4">
          <button
            onClick={() => { setMessages([]); setError(null); setRawResponse(null); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#262730] border border-white/10 rounded-lg text-sm font-medium text-[#FAFAFA] hover:bg-white/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Chat
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0E1117] relative">
        {/* Header */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0E1117] z-10 shrink-0">
          <h2 className="text-lg font-medium text-[#FAFAFA]">Chat Session</h2>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showDebug ? 'bg-[#4F8BFF]/10 text-[#4F8BFF]' : 'text-[#A3A8B8] hover:bg-white/5'}`}
          >
            {showDebug ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            System Debug
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#A3A8B8] space-y-4">
              <Bot className="w-12 h-12 opacity-50" />
              <p className="text-lg">Send a message to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#262730] border border-white/10 text-[#FAFAFA]' : 'bg-[#4F8BFF]/20 text-[#4F8BFF]'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-[0.95rem] leading-relaxed ${msg.role === 'user' ? 'bg-[#262730] border border-white/5 text-[#FAFAFA]' : 'bg-[#4F8BFF]/5 border border-[#4F8BFF]/20 text-[#FAFAFA]'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#4F8BFF]/20 text-[#4F8BFF] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-[#4F8BFF]/5 border border-[#4F8BFF]/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#4F8BFF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#4F8BFF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#4F8BFF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-[#FF4B4B]/10 border border-[#FF4B4B] text-[#FF4B4B] rounded-lg px-4 py-3 flex items-center gap-3 text-[0.85rem]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="whitespace-pre-wrap">{error}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 pt-2 bg-[#0E1117] shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message to gemma3..."
              disabled={isLoading}
              className="flex-1 bg-[#262730] border border-white/10 text-[#FAFAFA] p-[14px] rounded-xl focus:outline-none focus:border-[#4F8BFF] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-[#4F8BFF] text-white px-6 rounded-xl font-semibold hover:bg-[#4F8BFF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="w-96 bg-[#000000] text-[#00FF41] flex flex-col border-l border-[#262730] shrink-0">
          <div className="h-14 border-b border-[#262730] flex items-center justify-between px-4 bg-[#000000] shrink-0 font-mono text-[0.75rem] text-[#A3A8B8] uppercase">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span>System Debug Window</span>
            </div>
            <span>Raw JSON Response</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[0.8rem]">
            {rawResponse ? (
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            ) : (
              <div className="text-[#A3A8B8] italic">
                No response data yet. Send a message to see the raw API response here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
