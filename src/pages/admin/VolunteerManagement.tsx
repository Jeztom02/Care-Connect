import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VolunteerMatcher } from '@/components/admin/VolunteerMatcher';
import { UserPlus } from 'lucide-react';

export const VolunteerManagement = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserPlus className="h-8 w-8 text-purple-600" />
          Volunteer Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Match volunteers to tasks using AI-powered similarity matching
        </p>
      </div>

      {/* Volunteer Matcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VolunteerMatcher />
        
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              K-Nearest Neighbors algorithm for optimal matching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Matching Criteria</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Skills Match:</strong> How well volunteer skills align with task requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Experience:</strong> Years of volunteer experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Performance:</strong> Past tasks completed and ratings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Availability:</strong> Current available hours per week</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Language:</strong> Language proficiency match</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Preferences:</strong> Volunteer's preferred task types</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Match Score</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-3 bg-green-500 rounded"></div>
                  <span>90-100%: Excellent Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-3 bg-blue-500 rounded"></div>
                  <span>75-89%: Good Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-3 bg-yellow-500 rounded"></div>
                  <span>60-74%: Fair Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-3 bg-gray-500 rounded"></div>
                  <span>&lt;60%: Possible Match</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <h4 className="font-semibold text-purple-900 mb-1">Benefits</h4>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>✓ Optimal volunteer-task pairing</li>
                <li>✓ Higher task completion rates</li>
                <li>✓ Better volunteer satisfaction</li>
                <li>✓ Data-driven decisions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
