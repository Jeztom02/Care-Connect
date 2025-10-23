import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

export const UserManagement = () => {
  const users = [
    { id: 1, name: "Dr. Sarah Johnson", role: "Doctor", status: "Active" },
    { id: 2, name: "Nurse Emily Chen", role: "Nurse", status: "Active" },
    { id: 3, name: "John Smith", role: "Patient", status: "Active" }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage system users and permissions</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.role} • {user.status}</p>
                </div>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};