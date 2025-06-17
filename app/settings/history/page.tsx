"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { History, Download, Trash2, Cloud } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">History & Sync</h1>
        <p className="text-muted-foreground">Manage your chat history and synchronization settings</p>
      </div>

      <Separator />

      {/* Chat History Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Chat History
          </CardTitle>
          <CardDescription>
            Control how your chat history is stored and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="save-history" className="text-sm font-medium">
                Save Chat History
              </Label>
              <p className="text-xs text-muted-foreground">
                Store your conversations for future reference
              </p>
            </div>
            <Switch id="save-history" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-title" className="text-sm font-medium">
                Auto-generate Titles
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically create titles for your conversations
              </p>
            </div>
            <Switch id="auto-title" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="search-history" className="text-sm font-medium">
                Include History in Search
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow searching through your chat history
              </p>
            </div>
            <Switch id="search-history" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Cloud Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Cloud Sync
          </CardTitle>
          <CardDescription>
            Synchronize your data across devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cloud-sync" className="text-sm font-medium">
                Enable Cloud Sync
              </Label>
              <p className="text-xs text-muted-foreground">
                Sync your chats and settings across all your devices
              </p>
            </div>
            <Switch id="cloud-sync" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-sync" className="text-sm font-medium">
                Auto Sync
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically sync changes in real-time
              </p>
            </div>
            <Switch id="auto-sync" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sync-settings" className="text-sm font-medium">
                Sync Settings
              </Label>
              <p className="text-xs text-muted-foreground">
                Include your preferences and customizations in sync
              </p>
            </div>
            <Switch id="sync-settings" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or delete your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">Export Chat History</div>
              <div className="text-sm text-muted-foreground">
                Download all your conversations as JSON
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
            <div>
              <div className="font-medium text-destructive">Clear All History</div>
              <div className="text-sm text-muted-foreground">
                Permanently delete all your chat history
              </div>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>
            View your current storage usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Chat History</span>
              <span>2.4 MB / 100 MB</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-[2.4%]"></div>
            </div>
            <p className="text-xs text-muted-foreground">
              You're using 2.4% of your available storage
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 