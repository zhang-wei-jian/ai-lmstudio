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
import { Bot, User, Mic, CheckCircle2, Circle, Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  url: string;
}

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ url }) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState<number | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  React.useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 1000 / 240); // 240 FPS Target (approx 4.16ms)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="flex items-center gap-3 py-1 cursor-pointer group/voice"
      onClick={togglePlay}
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-active/voice:scale-90 transition-transform">
        {isPlaying ? (
          <Pause size={16} className="text-primary fill-primary/20" />
        ) : (
          <Play size={16} className="text-primary translate-x-0.5 fill-primary/20" />
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-32">
        <div className="relative flex items-center h-4 w-full">
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none overflow-hidden">
            {[...Array(18)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-0.5 rounded-full transition-colors",
                  progress >= (i / 17) * 100 ? "bg-primary" : "bg-primary/20"
                )}
                style={{ 
                  height: `${4 + (Math.sin(i * 0.8) + 1) * 5}px`,
                }} 
              />
            ))}
          </div>
          
          {/* Moving progress bar */}
          <div 
            className="absolute top-0 bottom-0 w-[1.5px] bg-primary shadow-[0_0_8px_#00D2FF] z-10"
            style={{ 
              left: `${progress}%`,
              transform: 'translateX(-50%)',
              transition: 'none'
            }}
          />
        </div>
        <div className="flex justify-end items-center px-0.5">
          <span className="text-[10px] font-medium text-muted-foreground/60">
            {duration ? formatTime(duration) : '--:--'}
          </span>
        </div>
      </div>
      <audio 
        ref={audioRef}
        src={url} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
        onLoadedMetadata={onLoadedMetadata}
        className="hidden" 
      />
    </div>
  );
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  settings: AppSettings;
  isSelectionMode: boolean;
  isSearching: boolean;
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onEnterSelectionMode: (id: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  settings,
  isSelectionMode,
  isSearching,
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
      if (isSearching) {
        setIsDragging(true);
      }
      lastSelectedId.current = id;
      onToggleSelection(id);
      return;
    }
    if (!isSearching) return;
    longPressTimer.current = setTimeout(() => {
      onEnterSelectionMode(id);
      setIsDragging(true);
      lastSelectedId.current = id;
    }, 600);
  };

  const handleTouchStart = (id: string) => {
    if (!isSearching && !isSelectionMode) return;
    // For touch, we want to trigger long press immediately
    longPressTimer.current = setTimeout(() => {
      if (!isSelectionMode) {
        onEnterSelectionMode(id);
      }
      if (isSearching) {
        setIsDragging(true);
      }
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

            <div className={cn(
              "flex flex-col max-w-[85%] transition-opacity",
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
                  <VoiceMessagePlayer url={message.mediaUrl} />
                )}

                {message.content && (
                  <div className={cn(
                    "prose prose-sm dark:prose-invert max-w-none",
                    (message.type === 'image' || message.type === 'voice') && "mt-2 pt-2 border-t border-border/50"
                  )}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
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
