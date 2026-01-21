import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserPlus, Loader2, Star, Award, CheckCircle, Mail, Briefcase } from 'lucide-react';
import { useVolunteerMatch, VolunteerCandidate } from '@/hooks/useKNN';
import { useToast } from '@/hooks/use-toast';

interface VolunteerMatcherProps {
  taskId?: string;
}

export const VolunteerMatcher = ({ taskId: initialTaskId }: VolunteerMatcherProps) => {
  const { findCandidates, loading, error, result } = useVolunteerMatch();
  const { toast } = useToast();
  const [taskId, setTaskId] = useState(initialTaskId || '');
  const [k, setK] = useState(5);

  const handleFindCandidates = async () => {
    if (!taskId.trim()) {
      toast({
        title: '❌ Task ID Required',
        description: 'Please enter a task ID',
        variant: 'destructive',
      });
      return;
    }

    try {
      await findCandidates(taskId, k);
      toast({
        title: '✅ Candidates Found',
        description: `Found ${k} best volunteer matches for this task`,
      });
    } catch (err) {
      toast({
        title: '❌ Search Failed',
        description: error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 75) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Possible Match';
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'fill-yellow-200 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-purple-600" />
          Volunteer-Task Matcher (KNN)
        </CardTitle>
        <CardDescription>
          Find the best volunteers for a task based on skills, experience, and availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Task ID:</label>
            <Input
              placeholder="Enter task ID (e.g., task123)"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Number of candidates:
            </label>
            <div className="flex gap-2">
              {[3, 5, 10].map(num => (
                <Button
                  key={num}
                  variant={k === num ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setK(num)}
                  disabled={loading}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleFindCandidates} 
            disabled={loading || !taskId.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finding Best Matches...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Find Volunteer Candidates
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {/* Task Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Task Details</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Type:</strong> {result.task.type}</p>
                <p><strong>Required Skills:</strong></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.task.requiredSkills.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2"><strong>Languages:</strong> {result.task.requiredLanguages.join(', ')}</p>
                <p><strong>Estimated Hours:</strong> {result.task.estimatedHours}h</p>
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                Top {result.candidates.length} Candidates
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleFindCandidates}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>

            {/* Candidates List */}
            <div className="space-y-3">
              {result.candidates.map((candidate: VolunteerCandidate) => (
                <Card key={candidate.rank} className="border-l-4" style={{
                  borderLeftColor: candidate.matchScore >= 90 ? '#22c55e' : 
                                   candidate.matchScore >= 75 ? '#3b82f6' : 
                                   candidate.matchScore >= 60 ? '#eab308' : '#6b7280'
                }}>
                  <CardContent className="p-4">
                    {/* Volunteer Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold">
                          #{candidate.rank}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{candidate.volunteer.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {candidate.volunteer.email}
                          </p>
                          <div className="mt-1">
                            {renderStars(candidate.volunteer.rating)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getMatchColor(candidate.matchScore)}>
                          {candidate.matchScore}% Match
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getMatchLabel(candidate.matchScore)}
                        </p>
                      </div>
                    </div>

                    {/* Experience & Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {candidate.volunteer.experienceYears} years
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-muted-foreground">Tasks Done</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {candidate.volunteer.tasksCompleted}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-muted-foreground">Rating</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {candidate.volunteer.rating}/5.0
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-1">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.volunteer.skills.map((skill, idx) => (
                          <Badge 
                            key={idx} 
                            variant={result.task.requiredSkills.includes(skill) ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {skill}
                            {result.task.requiredSkills.includes(skill) && ' ✓'}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-blue-900 mb-2">
                        Why This Match:
                      </h5>
                      <ul className="space-y-1">
                        {candidate.matchReasons.map((reason, idx) => (
                          <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Assign Button */}
                    <Button 
                      className="w-full mt-3" 
                      size="sm"
                      variant={candidate.matchScore >= 75 ? 'default' : 'outline'}
                    >
                      Assign to Task
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground text-right">
              Generated: {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
