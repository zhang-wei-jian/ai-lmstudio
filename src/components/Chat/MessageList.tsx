/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, AppSettings } from '../../types';
import { cn, formatMessageDate } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { motion } from 'motion/react';
import { Bot, User, Mic, CheckCircle2, Circle } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  settings: AppSettings;
  isSelectionMode: boolean;
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onEnterSelectionMode: (id: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  settings,
  isSelectionMode,
  selectedIds,
  onToggleSelection,
  onEnterSelectionMode
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const lastSelectedId = React.useRef<string | null>(null);

  const handleMouseDown = (id: string) => {
    if (isSelectionMode) {
      setIsDragging(true);
      lastSelectedId.current = id;
      onToggleSelection(id);
      return;
    }
    longPressTimer.current = setTimeout(() => {
      onEnterSelectionMode(id);
      setIsDragging(true);
      lastSelectedId.current = id;
    }, 600);
  };

  const handleTouchStart = (id: string) => {
    // For touch, we want to trigger long press immediately
    longPressTimer.current = setTimeout(() => {
      if (!isSelectionMode) {
        onEnterSelectionMode(id);
      }
      setIsDragging(true);
      lastSelectedId.current = id;
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsDragging(false);
    lastSelectedId.current = null;
  };

  const handleClick = (id: string) => {
    if (isSelectionMode) {
      onToggleSelection(id);
    }
  };

  const handleMouseEnter = (id: string) => {
    if (isDragging && isSelectionMode && lastSelectedId.current !== id) {
      onToggleSelection(id);
      lastSelectedId.current = id;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isSelectionMode) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const messageElement = element?.closest('[data-message-id]');
    
    if (messageElement) {
      const id = messageElement.getAttribute('data-message-id');
      if (id && lastSelectedId.current !== id) {
        onToggleSelection(id);
        lastSelectedId.current = id;
      }
    }
  };

  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      lastSelectedId.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  React.useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current && !isSelectionMode) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    };
    
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading, isSelectionMode]);

  return (
    <div 
      ref={scrollRef} 
      className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 select-none"
      onTouchMove={handleTouchMove}
    >
      {messages.map((message) => {
        const isSelected = selectedIds.includes(message.id);
        
        return (
          <motion.div
            key={message.id}
            data-message-id={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onMouseDown={() => handleMouseDown(message.id)}
            onMouseUp={handleTouchEnd}
            onMouseEnter={() => handleMouseEnter(message.id)}
            onTouchStart={() => handleTouchStart(message.id)}
            onTouchEnd={handleTouchEnd}
            onClick={() => handleClick(message.id)}
            className={cn(
              "flex w-full gap-3 transition-all duration-300",
              message.role === 'user' ? "flex-row-reverse" : "flex-row",
              isSelectionMode && "cursor-pointer active:scale-[0.98]",
              isSelected && "opacity-100 scale-[1.02]"
            )}
          >
            {isSelectionMode && (
              <div className="flex items-center justify-center px-2">
                {isSelected ? (
                  <CheckCircle2 className="text-primary size-5 fill-primary/10" />
                ) : (
                  <Circle className="text-muted-foreground/30 size-5" />
                )}
              </div>
            )}

            <Avatar className={cn(
              "w-8 h-8 border shrink-0 transition-opacity",
              isSelectionMode && !isSelected && "opacity-50"
            )}>
              {message.role === 'assistant' ? (
                <>
                  <AvatarImage src={settings.aiAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${settings.aiName}`} />
                  <AvatarFallback><Bot size={16} /></AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src={settings.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${settings.userName}`} />
                  <AvatarFallback><User size={16} /></AvatarFallback>
                </>
              )}
            </Avatar>

            <div className={cn(
              "flex flex-col max-w-[70%] transition-opacity",
              message.role === 'user' ? "items-end" : "items-start",
              isSelectionMode && !isSelected && "opacity-50"
            )}>
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-medium text-muted-foreground tracking-wider">
                  {message.role === 'assistant' ? settings.aiName : settings.userName}
                </span>
              </div>
              <div className={cn(
                "px-5 py-4 rounded-[20px] text-[15px] leading-relaxed transition-all",
                message.role === 'user' 
                  ? "bg-white dark:bg-card border border-border rounded-br-[4px] text-black dark:text-foreground" 
                  : "bg-white dark:bg-card border border-border rounded-bl-[4px] text-black dark:text-foreground",
                isSelected && "ring-2 ring-primary/50 border-primary/50 shadow-lg shadow-primary/10"
              )}>
                {message.type === 'image' && message.mediaUrl && (
                  <img 
                    src={message.mediaUrl} 
                    alt="Uploaded" 
                    className="rounded-lg mb-2 max-w-full h-auto"
                    referrerPolicy="no-referrer"
                  />
                )}
                
                {message.type === 'voice' && message.mediaUrl && (
                  <div className="flex items-center gap-2 py-1">
                    <Mic size={16} className="text-primary-foreground/80" />
                    <audio src={message.mediaUrl} controls className="h-8 w-40" />
                  </div>
                )}

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {formatMessageDate(message.timestamp)}
              </span>
            </div>
          </motion.div>
        );
      })}
      
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3"
        >
          <Avatar className="w-8 h-8 border animate-pulse">
            <AvatarFallback><Bot size={16} /></AvatarFallback>
          </Avatar>
          <div className="bg-white dark:bg-muted border border-border dark:border-none px-4 py-3 rounded-2xl rounded-tl-none shadow-sm dark:shadow-none">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
