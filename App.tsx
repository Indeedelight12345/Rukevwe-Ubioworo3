import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Message } from './types';
import { UserIcon, SparkleIcon, SendIcon, ClipboardIcon } from './components/Icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-4 rounded-md overflow-hidden border border-gray-700">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-700 text-xs">
                <span className="text-gray-400 capitalize">{language}</span>
                <button onClick={handleCopy} className="flex items-center gap-1 text-gray-400 hover:text-white">
                    <ClipboardIcon className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{ margin: 0 }}
              wrapLongLines={true}
            >
                {code.trim()}
            </SyntaxHighlighter>
        </div>
    );
};

const renderContent = (content: string) => {
    const parts = content.split(/(```(?:[a-zA-Z0-9]+)?\n[\s\S]*?\n```)/g);
    return parts.map((part, index) => {
        const codeBlockMatch = part.match(/^```([a-zA-Z0-9]*)?\n([\s\S]*?)\n```$/);
        if (codeBlockMatch) {
            const language = codeBlockMatch[1] || 'text';
            const code = codeBlockMatch[2];
            return <CodeBlock key={index} code={code} language={language} />;
        }
        if(part.trim()){
            return <p key={index} className="whitespace-pre-wrap">{part}</p>;
        }
        return null;
    });
};

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: 'Hello! I am your AI Code Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const model = 'gemini-3-pro-preview';
            const systemInstruction = "You are an expert programmer and AI code assistant. Provide clear, concise, and correct code examples in Markdown format.";
            const responseStream = await ai.models.generateContentStream({
                model,
                contents: input,
                config: { systemInstruction },
            });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of responseStream) {
                if (chunk.text) {
                    modelResponse += chunk.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].content = modelResponse;
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage: Message = { role: 'model', content: "Sorry, something went wrong. Please check your API key and try again." };
            setMessages(prev => [...prev.slice(0, -1), errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-200">
            <header className="p-4 border-b border-gray-700">
                <h1 className="text-xl font-bold text-center">AI Code Assistant</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <SparkleIcon className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />}
                        <div className={`max-w-4xl rounded-lg p-4 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-gray-700 to-gray-800'}`}>
                            <div className="prose prose-invert max-w-none">
                                {renderContent(msg.content)}
                            </div>
                        </div>
                        {msg.role === 'user' && <UserIcon className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1" />}
                    </div>
                ))}
                {isLoading && messages[messages.length-1].role === 'user' && (
                     <div className="flex items-start gap-4">
                        <SparkleIcon className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div className="max-w-4xl rounded-lg p-4 bg-gray-800">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </main>

            <footer className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder="Ask a coding question..."
                        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-full p-3">
                        <SendIcon className="w-6 h-6" />
                    </button>
                </form>
            </footer>
             <style>{`
                .prose { color: #d1d5db; }
                .prose p { margin-top: 0; margin-bottom: 1em; }
                .prose code { color: #f97316; }
                .typing-indicator span {
                    height: 8px; width: 8px; background-color: #9ca3af;
                    border-radius: 50%; display: inline-block;
                    animation: wave 1.4s infinite ease-in-out both;
                }
                .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
                @keyframes wave {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
            `}</style>
        </div>
    );
};

export default App;