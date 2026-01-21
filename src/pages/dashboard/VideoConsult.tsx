import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, 
  MessageSquare, FileText, Share2, Users, 
  Settings, MoreVertical, Paperclip
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const VideoConsult = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Consultation</h1>
          <p className="text-muted-foreground">Dr. Sarah Wilson • Patient: John Doe</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Connected
          </Badge>
          <span className="text-sm font-mono text-muted-foreground">12:45</span>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-lg group">
            {/* Main Video Feed (Patient) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-white/10">
                  <AvatarImage src="/placeholder-patient.jpg" />
                  <AvatarFallback className="text-4xl bg-slate-800 text-slate-400">JD</AvatarFallback>
                </Avatar>
                <p className="text-slate-400 font-medium">John Doe</p>
                <p className="text-slate-500 text-sm">Waiting for video...</p>
              </div>
            </div>

            {/* Self View (Doctor) */}
            <div className="absolute top-4 right-4 w-48 aspect-video bg-slate-800 rounded-lg border border-white/10 shadow-xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-slate-700">
                <span className="text-xs text-slate-400">You</span>
              </div>
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="rounded-full h-12 w-12"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  variant={isVideoOff ? "destructive" : "secondary"}
                  size="icon"
                  className="rounded-full h-12 w-12"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full h-14 w-14 shadow-lg hover:bg-red-600"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full h-12 w-12"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <FileText className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full h-12 w-12"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <Card className="w-80 flex flex-col h-full border-l shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Patient Details</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">Male, 45y</p>
                </div>
              </div>
              
              <Separator />

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Vitals (Today)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">BP</p>
                        <p className="font-medium">120/80</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">HR</p>
                        <p className="font-medium">72 bpm</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Temp</p>
                        <p className="font-medium">98.6°F</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">SpO2</p>
                        <p className="font-medium">98%</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Shared Files</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="p-2 bg-blue-100 rounded text-blue-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">Blood_Work_Jan24.pdf</p>
                          <p className="text-xs text-muted-foreground">2.4 MB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="p-2 bg-purple-100 rounded text-purple-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">XRay_Chest.jpg</p>
                          <p className="text-xs text-muted-foreground">4.1 MB</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-2 text-xs h-8">
                      <Paperclip className="h-3 w-3 mr-2" />
                      Share File
                    </Button>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Notes</h4>
                    <textarea 
                      className="w-full min-h-[100px] p-2 text-sm rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Type consultation notes..."
                    />
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
