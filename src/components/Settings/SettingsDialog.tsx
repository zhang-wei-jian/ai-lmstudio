/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppSettings } from '../../types';

import { ImagePlus, X } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof AppSettings) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearField = (field: keyof AppSettings) => {
    setLocalSettings(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  const FileUploadField = ({ label, field, placeholder }: { label: string, field: keyof AppSettings, placeholder?: string }) => (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right text-xs">{label}</Label>
      <div className="col-span-3 flex items-center gap-2">
        {localSettings[field] ? (
          <div className="relative group">
            <img 
              src={localSettings[field] as string} 
              alt={label} 
              className="w-10 h-10 rounded-lg object-cover border border-border" 
            />
            <button 
              onClick={() => clearField(field)}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <label className="w-10 h-10 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
            <ImagePlus size={16} className="text-muted-foreground" />
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileUpload(e, field)} 
            />
          </label>
        )}
        <span className="text-[10px] text-muted-foreground truncate flex-1">
          {localSettings[field] ? '已选择本地图片' : (placeholder || '点击上传本地图片')}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>应用设置</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userName" className="text-right text-xs">用户名</Label>
            <Input id="userName" name="userName" value={localSettings.userName} onChange={handleChange} className="col-span-3 h-8 text-xs" />
          </div>
          
          <FileUploadField label="用户头像" field="userAvatar" />

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="aiName" className="text-right text-xs">AI 名称</Label>
            <Input id="aiName" name="aiName" value={localSettings.aiName} onChange={handleChange} className="col-span-3 h-8 text-xs" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="aiSubtitle" className="text-right text-xs">AI 副标题</Label>
            <Input id="aiSubtitle" name="aiSubtitle" value={localSettings.aiSubtitle} onChange={handleChange} className="col-span-3 h-8 text-xs" />
          </div>

          <FileUploadField label="AI 头像" field="aiAvatar" />

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right text-xs">API Key</Label>
            <Input id="apiKey" name="apiKey" type="password" value={localSettings.apiKey} onChange={handleChange} className="col-span-3 h-8 text-xs" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modelName" className="text-right text-xs">模型名称</Label>
            <Input id="modelName" name="modelName" value={localSettings.modelName} onChange={handleChange} className="col-span-3 h-8 text-xs" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiEndpoint" className="text-right text-xs">API 终端</Label>
            <Input id="apiEndpoint" name="apiEndpoint" value={localSettings.apiEndpoint} onChange={handleChange} className="col-span-3 h-8 text-xs" />
          </div>

          <FileUploadField label="自定义背景" field="customBackground" placeholder="仅在亮色模式生效" />
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="welcomeMessage" className="text-right text-xs">欢迎标语</Label>
            <Input id="welcomeMessage" name="welcomeMessage" value={localSettings.welcomeMessage || ''} onChange={handleChange} className="col-span-3 h-8 text-xs" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="systemInstruction" className="text-right text-xs">回复逻辑</Label>
            <Input id="systemInstruction" name="systemInstruction" value={localSettings.systemInstruction || ''} onChange={handleChange} className="col-span-3 h-8 text-xs" placeholder="例如：你是一个专业的程序员" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full">保存更改</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
