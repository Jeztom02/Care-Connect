import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, Loader2, TrendingUp, User, MapPin, Activity, CheckCircle } from 'lucide-react';
import { useSimilarPatients, SimilarPatient } from '@/hooks/useKNN';
import { useToast } from '@/hooks/use-toast';

interface SimilarPatientsProps {
  patientId: string;
  patientName?: string;
}

export const SimilarPatientsComponent = ({ patientId, patientName }: SimilarPatientsProps) => {
  const { findSimilar, loading, error, result } = useSimilarPatients();
  const { toast } = useToast();
  const [k, setK] = useState(5);
  const [showDetails, setShowDetails] = useState<{ [key: number]: boolean }>({});

  const handleFindSimilar = async () => {
    try {
      await findSimilar(patientId, k);
      toast({
        title: '✅ Similar Patients Found',
        description: `Found ${k} similar patients based on clinical features`,
      });
    } catch (err) {
      toast({
        title: '❌ Search Failed',
        description: error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const toggleDetails = (rank: number) => {
    setShowDetails(prev => ({ ...prev, [rank]: !prev[rank] }));
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return 'bg-green-100 text-green-700 border-green-300';
    if (similarity >= 75) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (similarity >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 90) return 'Very Similar';
    if (similarity >= 75) return 'Similar';
    if (similarity >= 60) return 'Moderately Similar';
    return 'Somewhat Similar';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Similar Patients (KNN)
        </CardTitle>
        <CardDescription>
          Find patients with similar conditions and vitals for clinical reference
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Number of similar patients to find:
              </label>
              <div className="flex gap-2">
                {[3, 5, 10].map(num => (
                  <Button
                    key={num}
                    variant={k === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setK(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
            <Button 
              onClick={handleFindSimilar} 
              disabled={loading}
              className="mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Find Similar Patients
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  Found {result.similarPatients.length} Similar Patients
                </h3>
                <p className="text-sm text-muted-foreground">
                  Based on clinical features of {result.targetPatient.name}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleFindSimilar}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>

            {/* Similar Patients List */}
            <div className="space-y-3">
              {result.similarPatients.map((similar: SimilarPatient) => (
                <Card key={similar.rank} className="border-l-4" style={{
                  borderLeftColor: similar.similarity >= 90 ? '#22c55e' : 
                                   similar.similarity >= 75 ? '#3b82f6' : 
                                   similar.similarity >= 60 ? '#eab308' : '#6b7280'
                }}>
                  <CardContent className="p-4">
                    {/* Patient Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold">
                          #{similar.rank}
                        </div>
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {similar.patient.name}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{similar.patient.age} years</span>
                            <span>•</span>
                            <span>{similar.patient.gender}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {similar.patient.roomNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getSimilarityColor(similar.similarity)}>
                          {similar.similarity}% Match
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getSimilarityLabel(similar.similarity)}
                        </p>
                      </div>
                    </div>

                    {/* Condition */}
                    <div className="mb-3">
                      <Badge variant="outline" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        {similar.patient.condition}
                      </Badge>
                    </div>

                    {/* Match Reasons */}
                    <div className="mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDetails(similar.rank)}
                        className="text-xs"
                      >
                        {showDetails[similar.rank] ? 'Hide' : 'Show'} Match Details
                      </Button>

                      {showDetails[similar.rank] && (
                        <div className="mt-2 space-y-2">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h5 className="text-xs font-semibold text-blue-900 mb-2">
                              Why Similar:
                            </h5>
                            <ul className="space-y-1">
                              {similar.matchReasons.map((reason, idx) => (
                                <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {similar.sharedConditions.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <h5 className="text-xs font-semibold text-green-900 mb-2">
                                Shared Conditions:
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {similar.sharedConditions.map((condition, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-white">
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Distance Score */}
                    <div className="text-xs text-muted-foreground">
                      Distance: {similar.distance}
                    </div>
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
